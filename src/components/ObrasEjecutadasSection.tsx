"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type ObraEjecutada = {
  id: string;
  cliente: string;
  monto: number;
  fecha: string;
};

export default function ObrasEjecutadasSection({ items }: { items: ObraEjecutada[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return items.slice(0, 5);
    const q = busqueda.trim().toLowerCase();
    return items.filter((o) => o.cliente.toLowerCase().includes(q));
  }, [items, busqueda]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm uppercase tracking-wide text-text-dim">
          Obras ejecutadas
        </h2>
        <span className="text-text-dim text-xs">{items.length} en total</span>
      </div>

      <div className="relative mb-3">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
        />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar obra ejecutada por cliente..."
          className="w-full rounded-lg bg-surface border border-border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {!busqueda && (
        <p className="text-text-dim text-xs mb-2">Mostrando las 5 más recientes</p>
      )}

      <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
        {filtradas.length === 0 && (
          <p className="text-text-dim text-sm text-center py-8">
            {busqueda
              ? "Sin obras ejecutadas para ese cliente."
              : "Sin obras ejecutadas todavía."}
          </p>
        )}
        {filtradas.map((o) => (
          <Link
            key={o.id}
            href={`/obra/${o.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition"
          >
            <div>
              <p className="font-medium text-sm">{o.cliente}</p>
              <p className="text-text-dim text-xs">
                {new Date(o.fecha).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="text-sm font-medium">
              ${Math.round(o.monto).toLocaleString("es-CL")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
