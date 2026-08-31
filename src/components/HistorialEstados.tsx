import { History } from "lucide-react";

type EntradaAuditoria = {
  id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  motivo: string | null;
  created_at: string;
};

export default function HistorialEstados({
  entradas,
}: {
  entradas: EntradaAuditoria[];
}) {
  if (entradas.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-medium text-text-dim mb-2 flex items-center gap-1.5">
        <History size={14} /> Historial de estados
      </h2>
      <div className="border border-border rounded-xl bg-surface divide-y divide-border">
        {entradas.map((e) => (
          <div key={e.id} className="px-4 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span>
                {e.estado_anterior ? (
                  <>
                    <span className="text-text-dim">{e.estado_anterior}</span>
                    {" → "}
                    <span className="font-medium">{e.estado_nuevo}</span>
                  </>
                ) : (
                  <span className="font-medium">{e.estado_nuevo}</span>
                )}
              </span>
              <span className="text-text-dim text-xs shrink-0 ml-2">
                {new Date(e.created_at).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {e.motivo && (
              <p className="text-text-dim text-xs mt-1">{e.motivo}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
