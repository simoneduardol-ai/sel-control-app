"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import Link from "next/link";

export type EquipoLinea = {
  rowId: string;
  equipoId: string | null;
  nombre: string;
  unidad: string;
  costoUnitario: number;
  cantidadPorUnidad: number;
};

type EquipoMaestro = {
  id: string;
  nombre: string;
  marca: string | null;
  unidad: string;
  precio_unitario: number;
};

export default function EquiposItemEditor({
  lineas,
  onChange,
}: {
  lineas: EquipoLinea[];
  onChange: (lineas: EquipoLinea[]) => void;
}) {
  const supabase = createClient();
  const [catalogo, setCatalogo] = useState<EquipoMaestro[]>([]);
  const [filaAbierta, setFilaAbierta] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("equipos_maestros")
        .select("id, nombre, marca, unidad, precio_unitario")
        .order("nombre");
      setCatalogo(data ?? []);
    })();
  }, []);

  function actualizar(rowId: string, patch: Partial<EquipoLinea>) {
    onChange(lineas.map((l) => (l.rowId === rowId ? { ...l, ...patch } : l)));
  }

  function quitar(rowId: string) {
    onChange(lineas.filter((l) => l.rowId !== rowId));
  }

  function agregarFila() {
    const nuevoId = crypto.randomUUID();
    onChange([
      ...lineas,
      {
        rowId: nuevoId,
        equipoId: null,
        nombre: "",
        unidad: "un",
        costoUnitario: 0,
        cantidadPorUnidad: 1,
      },
    ]);
    setFilaAbierta(nuevoId);
  }

  function elegirEquipo(rowId: string, eq: EquipoMaestro) {
    actualizar(rowId, {
      equipoId: eq.id,
      nombre: eq.marca ? `${eq.nombre} (${eq.marca})` : eq.nombre,
      unidad: eq.unidad,
      costoUnitario: Number(eq.precio_unitario),
    });
    setFilaAbierta(null);
  }

  return (
    <div>
      <div className="space-y-2">
        {lineas.map((linea) => {
          const query = linea.nombre.trim().toLowerCase();
          const sugerencias =
            filaAbierta === linea.rowId
              ? (query
                  ? catalogo.filter((c) => c.nombre.toLowerCase().includes(query))
                  : catalogo
                ).slice(0, 30)
              : [];

          return (
            <div key={linea.rowId} className="flex items-start gap-2 relative">
              <div className="flex-1 relative">
                <input
                  value={linea.nombre}
                  onFocus={() => setFilaAbierta(linea.rowId)}
                  onChange={(e) => {
                    actualizar(linea.rowId, { nombre: e.target.value, equipoId: null });
                    setFilaAbierta(linea.rowId);
                  }}
                  onBlur={() => setTimeout(() => setFilaAbierta(null), 150)}
                  placeholder="Buscar equipo..."
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {filaAbierta === linea.rowId && sugerencias.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {sugerencias.map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onMouseDown={() => elegirEquipo(linea.rowId, eq)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-raised"
                      >
                        {eq.nombre} {eq.marca ? `(${eq.marca})` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {linea.equipoId && (
                <input
                  type="number"
                  step="0.01"
                  value={linea.cantidadPorUnidad}
                  onChange={(e) =>
                    actualizar(linea.rowId, { cantidadPorUnidad: Number(e.target.value) })
                  }
                  className="w-16 bg-surface border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
              <button onClick={() => quitar(linea.rowId)} className="text-text-dim p-2">
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <button onClick={agregarFila} className="mt-2 text-accent text-sm font-medium">
        + Agregar equipo
      </button>
      <p className="text-text-dim text-xs mt-2">
        Solo puedes elegir equipos ya cargados en{" "}
        <Link href="/equipos" className="underline">
          Equipos
        </Link>
        . Si necesitas uno nuevo, agrégalo ahí primero.
      </p>
    </div>
  );
}
