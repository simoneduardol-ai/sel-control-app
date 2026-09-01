"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/Sidebar";

const ETIQUETAS_DISPONIBLES = [
  "Cliente nuevo",
  "Seguimiento",
  "VIP",
  "Urgente",
  "Presupuesto",
  "Recurrente",
  "Adulto mayor",
  "Vista inicial",
];

export default function EditarVisitaPage() {
  const params = useParams();
  const router = useRouter();
  const visitaId = params.id as string;
  const supabase = createClient();

  const [cargando, setCargando] = useState(true);
  const [clienteNombre, setClienteNombre] = useState("");
  const [fechaVisita, setFechaVisita] = useState("");
  const [personaEnTerreno, setPersonaEnTerreno] = useState("");
  const [tipoTrabajo, setTipoTrabajo] = useState("");
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
  const [estadoSeguimiento, setEstadoSeguimiento] = useState("En progreso");
  const [referidoPor, setReferidoPor] = useState("");
  const [notasCliente, setNotasCliente] = useState("");
  const [requiereInforme, setRequiereInforme] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("visitas_terreno")
        .select("*, clientes(nombre)")
        .eq("id", visitaId)
        .single();

      if (data) {
        const cliente = data.clientes as unknown as { nombre: string } | null;
        setClienteNombre(cliente?.nombre ?? "");

        const fecha = new Date(data.fecha);
        fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
        setFechaVisita(fecha.toISOString().slice(0, 16));

        setPersonaEnTerreno(data.persona_en_terreno ?? "");
        setTipoTrabajo(data.tipo_trabajo ?? "");
        setEtiquetasSeleccionadas(data.etiquetas ?? []);
        setEstadoSeguimiento(data.estado_seguimiento ?? "En progreso");
        setReferidoPor(data.referido_por ?? "");
        setNotasCliente(data.notas_cliente ?? "");
        setRequiereInforme(!!data.requiere_informe_cliente);
      }
      setCargando(false);
    })();
  }, [visitaId]);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/visitas/${visitaId}/editar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: new Date(fechaVisita).toISOString(),
          persona_en_terreno: personaEnTerreno.trim() || null,
          tipo_trabajo: tipoTrabajo || null,
          etiquetas: etiquetasSeleccionadas,
          estado_seguimiento: estadoSeguimiento || null,
          referido_por: referidoPor || null,
          notas_cliente: notasCliente || null,
          requiere_informe_cliente: requiereInforme,
        }),
      });
      if (!res.ok) throw new Error();
      router.push(`/visita/${visitaId}`);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-dvh bg-bg md:flex">
        <Sidebar />
        <main className="flex-1 md:pl-64 flex items-center justify-center">
          <p className="text-text-dim text-sm">Cargando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-32">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link href={`/visita/${visitaId}`} className="p-1 -ml-1 text-text-dim">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="font-display text-lg">Editar visita</h1>
            <p className="text-text-dim text-xs">{clienteNombre}</p>
          </div>
        </header>

        <div className="px-5 md:px-8 py-6 max-w-2xl space-y-6">
          <p className="text-text-dim text-xs bg-surface border border-border rounded-xl p-3">
            Antes de guardar, se archiva automático una copia de cómo estaba esta visita
            antes del cambio (en Drive, dentro de la carpeta del cliente → Versiones).
          </p>

          <section className="grid grid-cols-2 gap-3">
            <div>
              <h2 className="text-sm font-medium text-text-dim mb-2">Fecha y hora</h2>
              <input
                type="datetime-local"
                value={fechaVisita}
                onChange={(e) => setFechaVisita(e.target.value)}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <h2 className="text-sm font-medium text-text-dim mb-2">Persona en terreno</h2>
              <input
                value={personaEnTerreno}
                onChange={(e) => setPersonaEnTerreno(e.target.value)}
                placeholder="Si no es el cliente..."
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">Detalles de la visita</h2>
            <div className="space-y-3">
              <input
                value={tipoTrabajo}
                onChange={(e) => setTipoTrabajo(e.target.value)}
                placeholder="Tipo de trabajo"
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div>
                <p className="text-xs text-text-dim mb-1.5">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {ETIQUETAS_DISPONIBLES.map((et) => {
                    const activa = etiquetasSeleccionadas.includes(et);
                    return (
                      <button
                        key={et}
                        type="button"
                        onClick={() =>
                          setEtiquetasSeleccionadas((prev) =>
                            activa ? prev.filter((e) => e !== et) : [...prev, et]
                          )
                        }
                        className={`rounded-full px-3 py-1.5 text-sm border transition ${
                          activa
                            ? "bg-accent text-accent-text border-accent"
                            : "bg-surface text-text-dim border-border"
                        }`}
                      >
                        {et}
                      </button>
                    );
                  })}
                </div>
              </div>
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
              <textarea
                value={notasCliente}
                onChange={(e) => setNotasCliente(e.target.value)}
                placeholder="Notas del cliente..."
                rows={3}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiereInforme}
                  onChange={(e) => setRequiereInforme(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Requiere informe para el cliente
              </label>
            </div>
          </section>

          <p className="text-text-dim text-xs">
            Nota: fotos, nota de voz y medidas no se editan desde aquí — solo los datos
            de arriba.
          </p>

          {error && (
            <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-bg/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 safe-bottom">
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full max-w-2xl rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </main>
    </div>
  );
}
