"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Camera,
  Mic,
  Square,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import ClienteSelector, { type ClienteOption } from "@/components/ClienteSelector";
import Sidebar from "@/components/Sidebar";

type Medida = { etiqueta: string; valor: string };

export default function NuevaVisitaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [cliente, setCliente] = useState<ClienteOption | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [grabando, setGrabando] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [medidas, setMedidas] = useState<Medida[]>([{ etiqueta: "", valor: "" }]);
  const [notas, setNotas] = useState("");
  const [tipoTrabajo, setTipoTrabajo] = useState("");
  const [etiquetasTexto, setEtiquetasTexto] = useState("");
  const [estadoSeguimiento, setEstadoSeguimiento] = useState("En progreso");
  const [referidoPor, setReferidoPor] = useState("");
  const [equiposUtilizados, setEquiposUtilizados] = useState("");
  const [costoEquipos, setCostoEquipos] = useState(0);
  const [kmRecorridos, setKmRecorridos] = useState(0);
  const [notasCliente, setNotasCliente] = useState("");
  const [totalEstimado, setTotalEstimado] = useState(0);
  const [requiereInforme, setRequiereInforme] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFotos((prev) => [...prev, ...files]);
    setFotosPreview((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function quitarFoto(idx: number) {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
    setFotosPreview((prev) => prev.filter((_, i) => i !== idx));
  }

  async function iniciarGrabacion() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setGrabando(true);
    } catch {
      setError("No se pudo acceder al micrófono. Revisa los permisos.");
    }
  }

  function detenerGrabacion() {
    mediaRecorderRef.current?.stop();
    setGrabando(false);
  }

  function actualizarMedida(idx: number, campo: keyof Medida, valor: string) {
    setMedidas((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [campo]: valor } : m))
    );
  }

  function agregarMedida() {
    setMedidas((prev) => [...prev, { etiqueta: "", valor: "" }]);
  }

  function quitarMedida(idx: number) {
    setMedidas((prev) => prev.filter((_, i) => i !== idx));
  }

  async function guardarVisita() {
    if (!cliente) {
      setError("Selecciona o crea un cliente primero.");
      return;
    }
    setGuardando(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const carpeta = `${user?.id}/${Date.now()}`;
      const fotoUrls: string[] = [];

      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];
        const path = `${carpeta}/foto-${i}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("visitas-media")
          .upload(path, foto);
        if (upErr) throw upErr;
        fotoUrls.push(path);
      }

      let audioPath: string | null = null;
      if (audioBlob) {
        audioPath = `${carpeta}/nota-voz.webm`;
        const { error: upErr } = await supabase.storage
          .from("visitas-media")
          .upload(audioPath, audioBlob);
        if (upErr) throw upErr;
      }

      const medidasObj: Record<string, string> = {};
      medidas
        .filter((m) => m.etiqueta.trim() !== "")
        .forEach((m) => {
          medidasObj[m.etiqueta.trim()] = m.valor;
        });

      const prompt = construirPromptDiagrama({
        cliente: cliente.nombre,
        direccion: cliente.direccion,
        medidas: medidasObj,
        notas,
        cantidadFotos: fotos.length,
      });

      const { data: visita, error: insertErr } = await supabase
        .from("visitas_terreno")
        .insert({
          cliente_id: cliente.id,
          fotos: fotoUrls,
          notas_voz_url: audioPath,
          notas_voz_transcripcion: notas || null,
          medidas: medidasObj,
          prompt_diagrama_ia: prompt,
          estado: "pendiente",
          tipo_trabajo: tipoTrabajo || null,
          etiquetas: etiquetasTexto
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
          estado_seguimiento: estadoSeguimiento || null,
          referido_por: referidoPor || null,
          equipos_utilizados: equiposUtilizados || null,
          costo_equipos: costoEquipos,
          km_recorridos: kmRecorridos,
          notas_cliente: notasCliente || null,
          total_estimado: totalEstimado,
          requiere_informe_cliente: requiereInforme,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      router.push(`/visita/${visita.id}`);
      router.refresh();
    } catch {
      setError("No se pudo guardar la visita. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-32">
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <Link href="/" className="p-1 -ml-1 text-text-dim md:hidden">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-lg">Nueva visita</h1>
      </header>

      <div className="px-5 md:px-8 py-5 max-w-2xl space-y-8">
        {/* Cliente */}
        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">Cliente</h2>
          <ClienteSelector value={cliente} onChange={setCliente} />
        </section>

        {/* Fotos */}
        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">Fotos</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleFotoChange}
          />
          <div className="grid grid-cols-3 gap-2">
            {fotosPreview.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => quitarFoto(idx)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-text-dim active:bg-surface"
            >
              <Camera size={22} />
              <span className="text-xs">Agregar</span>
            </button>
          </div>
        </section>

        {/* Nota de voz */}
        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">
            Nota de voz
          </h2>
          {!audioUrl ? (
            <button
              onClick={grabando ? detenerGrabacion : iniciarGrabacion}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium transition ${
                grabando
                  ? "bg-danger text-white"
                  : "bg-surface border border-border text-text"
              }`}
            >
              {grabando ? (
                <>
                  <Square size={18} /> Detener grabación
                </>
              ) : (
                <>
                  <Mic size={18} /> Grabar nota de voz
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3">
              <audio src={audioUrl} controls className="flex-1 h-10" />
              <button
                onClick={() => {
                  setAudioUrl(null);
                  setAudioBlob(null);
                }}
                className="text-text-dim p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}

          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="O escribe la nota directamente aquí..."
            rows={3}
            className="w-full mt-3 rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </section>

        {/* Medidas */}
        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">Medidas</h2>
          <div className="space-y-2">
            {medidas.map((m, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={m.etiqueta}
                  onChange={(e) =>
                    actualizarMedida(idx, "etiqueta", e.target.value)
                  }
                  placeholder="Ej: gabinete-medidor"
                  className="flex-1 rounded-xl bg-surface border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={m.valor}
                  onChange={(e) =>
                    actualizarMedida(idx, "valor", e.target.value)
                  }
                  placeholder="Ej: 15 m"
                  className="w-24 rounded-xl bg-surface border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={() => quitarMedida(idx)}
                  className="text-text-dim px-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={agregarMedida}
            className="mt-2 flex items-center gap-1.5 text-accent text-sm font-medium"
          >
            <Plus size={16} /> Agregar medida
          </button>
        </section>

        {/* Detalles de la visita (Bitácora) */}
        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">
            Detalles de la visita
          </h2>
          <div className="space-y-3">
            <input
              value={tipoTrabajo}
              onChange={(e) => setTipoTrabajo(e.target.value)}
              placeholder="Tipo de trabajo (ej: Revisión/Diagnóstico, Cotización, Reparación)"
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              value={etiquetasTexto}
              onChange={(e) => setEtiquetasTexto(e.target.value)}
              placeholder="Etiquetas separadas por coma (ej: Cliente nuevo, VIP)"
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={estadoSeguimiento}
                onChange={(e) => setEstadoSeguimiento(e.target.value)}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option>En progreso</option>
                <option>Requiere seguimiento</option>
                <option>Completado</option>
              </select>
              <input
                value={referidoPor}
                onChange={(e) => setReferidoPor(e.target.value)}
                placeholder="Referido por (opcional)"
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={equiposUtilizados}
                onChange={(e) => setEquiposUtilizados(e.target.value)}
                placeholder="Equipos utilizados"
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="number"
                value={costoEquipos}
                onChange={(e) => setCostoEquipos(Number(e.target.value))}
                placeholder="Costo equipos"
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.1"
                value={kmRecorridos}
                onChange={(e) => setKmRecorridos(Number(e.target.value))}
                placeholder="Km recorridos"
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="number"
                value={totalEstimado}
                onChange={(e) => setTotalEstimado(Number(e.target.value))}
                placeholder="Total estimado ($)"
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <textarea
              value={notasCliente}
              onChange={(e) => setNotasCliente(e.target.value)}
              placeholder="Notas personales del cliente (ej: prefiere WhatsApp, adulto mayor, etc.)"
              rows={2}
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <label className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-4 py-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={requiereInforme}
                onChange={(e) => setRequiereInforme(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Requiere informe formal para el cliente (inspección, mantención o diagnóstico complejo)
            </label>
          </div>
        </section>

        {error && (
          <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-bg/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 safe-bottom">
        <button
          onClick={guardarVisita}
          disabled={guardando}
          className="w-full max-w-2xl rounded-xl bg-accent text-accent-text font-semibold py-4 text-base active:scale-[0.98] transition disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar visita"}
        </button>
      </div>
      </main>
    </div>
  );
}

function construirPromptDiagrama({
  cliente,
  direccion,
  medidas,
  notas,
  cantidadFotos,
}: {
  cliente: string;
  direccion?: string | null;
  medidas: Record<string, string>;
  notas: string;
  cantidadFotos: number;
}) {
  const lineasMedidas = Object.entries(medidas)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `Genera un diagrama a mano alzada de una instalación eléctrica residencial/comercial bajo normativa RIC chilena, para la siguiente visita de terreno.

Cliente: ${cliente}
${direccion ? `Dirección: ${direccion}` : ""}

Medidas registradas:
${lineasMedidas || "(sin medidas registradas aún)"}

Notas de terreno:
${notas || "(sin notas escritas — revisar nota de voz adjunta)"}

Fotos de referencia adjuntas: ${cantidadFotos}

El diagrama debe mostrar el recorrido de la instalación (empalme, medidor, cámaras de inspección, canalización, tablero) con las distancias indicadas, en estilo esquemático simple.`;
}
