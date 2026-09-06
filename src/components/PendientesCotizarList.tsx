"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

type Pendiente = {
  id: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
};

export default function PendientesCotizarList({ items }: { items: Pendiente[] }) {
  const router = useRouter();

  return (
    <div className="mb-6 border border-warn/30 bg-warn/10 rounded-xl p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-medium text-warn mb-2">
        <AlertTriangle size={15} /> Pendientes por cotizar
      </h2>
      <p className="text-text-dim text-xs mb-3">
        Visitas cerradas donde quedó anotado que faltaba armar la cotización. Doble
        clic en el cliente para abrir una cotización nueva con sus datos.
      </p>
      <div className="space-y-1.5">
        {items.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-sm">
            <span
              onDoubleClick={() =>
                router.push(`/cotizacion/nueva?cliente_id=${v.clienteId}&visita_id=${v.id}`)
              }
              className="font-medium cursor-pointer select-none"
              title="Doble clic para crear la cotización de este cliente"
            >
              {v.clienteNombre}
            </span>
            <span className="text-text-dim text-xs">
              Visita del{" "}
              {new Date(v.fecha).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
