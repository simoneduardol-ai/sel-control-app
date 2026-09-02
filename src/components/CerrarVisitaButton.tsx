"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, RotateCcw } from "lucide-react";

export default function CerrarVisitaButton({
  visitaId,
  estadoActual,
}: {
  visitaId: string;
  estadoActual: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [requiereCotizacion, setRequiereCotizacion] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function cerrar() {
    setGuardando(true);
    await supabase
      .from("visitas_terreno")
      .update({ estado: "cerrada", requiere_cotizacion: requiereCotizacion })
      .eq("id", visitaId);
    setGuardando(false);
    setMostrarModal(false);
    router.refresh();
  }

  async function reabrir() {
    setGuardando(true);
    await supabase
      .from("visitas_terreno")
      .update({ estado: "pendiente" })
      .eq("id", visitaId);
    setGuardando(false);
    router.refresh();
  }

  if (estadoActual === "cerrada") {
    return (
      <button
        onClick={reabrir}
        disabled={guardando}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-3 text-sm font-medium text-text-dim disabled:opacity-60"
      >
        <RotateCcw size={15} />
        {guardando ? "Reabriendo..." : "Reabrir visita"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-ok text-white font-semibold py-3 text-sm"
      >
        <CheckCircle2 size={16} />
        Marcar como cerrada
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-display text-lg mb-2">¿Cerrar esta visita?</h2>
            <p className="text-text-dim text-sm mb-4">
              Deja de aparecer en &quot;Visitas pendientes&quot; del Tablero.
            </p>
            <label className="flex items-start gap-2.5 text-sm mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={requiereCotizacion}
                onChange={(e) => setRequiereCotizacion(e.target.checked)}
                className="h-4 w-4 mt-0.5 accent-accent"
              />
              Todavía tengo pendiente elaborar la cotización — recuérdamelo en
              Cotizaciones
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={cerrar}
                disabled={guardando}
                className="flex-1 rounded-xl bg-accent text-accent-text py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Cerrar visita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
