import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

export type TableRow = {
  id: string;
  href: string;
  cliente: string;
  detalle: string;
  status: string;
  fecha?: string | null;
};

export default function DataTable({
  rows,
  columnaDetalle,
  emptyLabel,
}: {
  rows: TableRow[];
  columnaDetalle: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-border rounded-xl py-10 text-center text-text-dim text-sm bg-surface">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wide">
            <th className="text-left font-medium px-4 py-3">Cliente</th>
            <th className="text-left font-medium px-4 py-3">
              {columnaDetalle}
            </th>
            <th className="text-left font-medium px-4 py-3">Estado</th>
            <th className="text-left font-medium px-4 py-3 w-32">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-surface-raised transition"
            >
              <td className="px-4 py-3">
                <Link href={row.href} className="font-medium hover:underline">
                  {row.cliente}
                </Link>
              </td>
              <td className="px-4 py-3 text-text-dim">{row.detalle}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-text-dim text-xs">
                {row.fecha
                  ? new Date(row.fecha).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
