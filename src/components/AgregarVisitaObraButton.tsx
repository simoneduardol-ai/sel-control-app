"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Upload, Loader2, Mic, Square } from "lucide-react";

export default function AgregarVisitaObraButton({
  obraId,
  avanceActual,
}: {
  obraId: string;
  avanceActual: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorMic, setErrorMic] = useState<string | null>(null);

  async function iniciarGrabacion() {
    setErrorMic(null);
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
      setErrorMic("No se pudo acceder al micrófono. Revisa los permisos.");
    }
  }

  function detenerGrabacion() {
    mediaRecorderRef.current?.stop();
    setGrabando(false);
  }

  async function subirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSubiendoFotos(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nuevas: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("visitas-media").upload(path, file);
      if (!error) nuevas.push(path);
    }
    setFotos((prev) => [...prev, ...nuevas]);
    setSubiendoFotos(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function guardar() {
    setGuardando(true);

    const avanceEstaVisita = Number(porcentaje) || 0;

    let notaVozUrl: string | null = null;
    if (audioBlob) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const path = `${user?.id}/${Date.now()}-nota-voz.webm`;
      const { error } = await supabase.storage
        .from("visitas-media")
        .upload(path, audioBlob);
      if (!error) notaVozUrl = path;
    }

    await supabase.from("bitacora_obra").insert({
      obra_id: obraId,
      fecha_visita: new Date(fecha).toISOString(),
      descripcion_avance: descripcion || null,
      porcentaje_avance_esta_visita: avanceEstaVisita,
      fotos_avance: fotos,
      nota_voz_url: notaVozUrl,
    });

    if (avanceEstaVisita > 0) {
      const nuevoAvance = Math.min(100, avanceActual + avanceEstaVisita);
      await supabase
        .from("obras_ejecucion")
        .update({ avance_porcentaje: nuevoAvance })
        .eq("id", obraId);
    }

    setGuardando(false);
    setAbierto(false);
    setDescripcion("");
    setPorcentaje("");
    setFotos([]);
    setAudioBlob(null);
    setAudioUrl(null);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-accent text-sm font-medium"
      >
        <Plus size={15} /> Agregar visita
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="bg-surface border border-border rounded-t-2xl md:rounded-2xl p-5 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">Agregar visita a la bitácora</h2>
              <button onClick={() => setAbierto(false)} className="text-text-dim">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-dim mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">
                  Qué se avanzó hoy
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Cableado del segundo piso, instalación de tablero..."
                  rows={3}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">
                  % de avance de esta visita (opcional)
                </label>
                <input
                  type="number"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                  placeholder="Ej: 15"
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-text-dim text-[11px] mt-1">
                  Se suma al avance total (hoy: {avanceActual}%). Déjalo en blanco si esta
                  visita no cambió el % de avance.
                </p>
              </div>

              <div>
                <label className="block text-xs text-text-dim mb-1.5">
                  Fotos (opcional)
                </label>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={subirFotos}
                />
                {fotos.length > 0 && (
                  <p className="text-text-dim text-xs mb-2">
                    {fotos.length} foto{fotos.length > 1 ? "s" : ""} lista
                    {fotos.length > 1 ? "s" : ""}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={subiendoFotos}
                  className="flex items-center gap-1.5 text-accent text-sm font-medium disabled:opacity-60"
                >
                  {subiendoFotos ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Upload size={15} />
                  )}
                  {subiendoFotos ? "Subiendo..." : "Agregar fotos"}
                </button>
              </div>

              <div>
                <label className="block text-xs text-text-dim mb-1.5">
                  Nota de voz (opcional)
                </label>
                {!audioUrl ? (
                  <button
                    type="button"
                    onClick={grabando ? detenerGrabacion : iniciarGrabacion}
                    className={`flex items-center gap-1.5 text-sm font-medium ${
                      grabando ? "text-danger" : "text-accent"
                    }`}
                  >
                    {grabando ? <Square size={15} /> : <Mic size={15} />}
                    {grabando ? "Detener grabación" : "Grabar nota de voz"}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <audio src={audioUrl} controls className="h-9 flex-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setAudioBlob(null);
                        setAudioUrl(null);
                      }}
                      className="text-text-dim"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {errorMic && (
                  <p className="text-danger text-[11px] mt-1">{errorMic}</p>
                )}
                <p className="text-text-dim text-[11px] mt-1">
                  Se guarda el audio tal cual — no se transcribe automáticamente a
                  texto.
                </p>
              </div>

              <button
                onClick={guardar}
                disabled={guardando}
                className="w-full rounded-xl bg-accent text-accent-text font-semibold py-3 text-sm disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
