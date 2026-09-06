"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";

export default function AgregarVisitaObraButton({
  obraId,
  avanceActual,
}: {
  obraId: string;
  avanceActual: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);

    const avanceEstaVisita = Number(porcentaje) || 0;

    await supabase.from("bitacora_obra").insert({
      obra_id: obraId,
      fecha_visita: new Date(fecha).toISOString(),
      descripcion_avance: descripcion || null,
      porcentaje_avance_esta_visita: avanceEstaVisita,
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
