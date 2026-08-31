"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pause, Play, CheckCircle2, Ban } from "lucide-react";

export default function ObraAccionesEstado({
  obraId,
  cotizacionId,
  numeroCotizacion,
  estadoActual,
}: {
  obraId: string;
  cotizacionId: string;
  numeroCotizacion: string | null;
  estadoActual: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [accionPendiente, setAccionPendiente] = useState<
    "PAUSADA" | "EN_CURSO" | "FINALIZADA" | "ANULADA" | null
  >(null);
  const [motivo, setMotivo] = useState("");
  const [revertirCotizacion, setRevertirCotizacion] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function confirmar() {
    if (!accionPendiente) return;
    setGuardando(true);

    await supabase
      .from("obras_ejecucion")
      .update({
        estado: accionPendiente,
        motivo_cambio_estado: motivo.trim() || null,
      })
      .eq("id", obraId);

    if (accionPendiente === "ANULADA" && revertirCotizacion) {
      await supabase
        .from("cotizaciones")
        .update({
          estado: "BORRADOR",
          motivo_cambio_estado: motivo.trim() || "Obra anulada por el usuario",
        })
        .eq("id", cotizacionId);
    }

    setGuardando(false);
    setAccionPendiente(null);
    setMotivo("");
    router.refresh();
  }

  const botones: {
    estado: "PAUSADA" | "EN_CURSO" | "FINALIZADA" | "ANULADA";
    label: string;
    icon: React.ReactNode;
    clase: string;
  }[] = [];

  if (estadoActual === "EN_CURSO") {
    botones.push(
      { estado: "PAUSADA", label: "Pausar", icon: <Pause size={15} />, clase: "border border-border" },
      { estado: "FINALIZADA", label: "Finalizar", icon: <CheckCircle2 size={15} />, clase: "bg-ok text-white" },
      { estado: "ANULADA", label: "Anular", icon: <Ban size={15} />, clase: "border border-danger text-danger" }
    );
  } else if (estadoActual === "PAUSADA") {
    botones.push(
      { estado: "EN_CURSO", label: "Reanudar", icon: <Play size={15} />, clase: "bg-accent text-accent-text" },
      { estado: "ANULADA", label: "Anular", icon: <Ban size={15} />, clase: "border border-danger text-danger" }
    );
  }

  if (botones.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {botones.map((b) => (
          <button
            key={b.estado}
            onClick={() => setAccionPendiente(b.estado)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${b.clase}`}
          >
            {b.icon} {b.label}
          </button>
        ))}
      </div>

      {accionPendiente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-display text-lg mb-2">
              {accionPendiente === "ANULADA" && "¿Anular esta obra?"}
              {accionPendiente === "PAUSADA" && "¿Pausar esta obra?"}
              {accionPendiente === "EN_CURSO" && "¿Reanudar esta obra?"}
              {accionPendiente === "FINALIZADA" && "¿Marcar como finalizada?"}
            </h2>

            {accionPendiente === "ANULADA" && (
              <p className="text-text-dim text-sm mb-4">
                ¿Desea revertir la cotización vinculada{" "}
                {numeroCotizacion ? `(${numeroCotizacion})` : ""} a estado pendiente? La
                obra quedará anulada de cualquier forma; esto solo decide qué pasa con la
                cotización.
              </p>
            )}

            {accionPendiente === "ANULADA" && (
              <label className="flex items-start gap-2.5 text-sm mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revertirCotizacion}
                  onChange={(e) => setRevertirCotizacion(e.target.checked)}
                  className="h-4 w-4 mt-0.5 accent-accent"
                />
                Sí, revertir la cotización a pendiente también
              </label>
            )}

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo (opcional)"
              rows={2}
              className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAccionPendiente(null);
                  setMotivo("");
                }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={guardando}
                className="flex-1 rounded-xl bg-accent text-accent-text py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
