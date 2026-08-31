"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export type EquipoLinea = {
  rowId: string;
  equipoId: string | null;
  nombre: string;
  unidad: string;
  costoUnitario: number;
  cantidadPorUnidad: number;
  agregarAMaestros: boolean;
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
  permitirLibre = false,
}: {
  lineas: EquipoLinea[];
  onChange: (lineas: EquipoLinea[]) => void;
  permitirLibre?: boolean;
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
        agregarAMaestros: true,
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

  function escribirNombre(rowId: string, texto: string) {
    actualizar(rowId, { nombre: texto, equipoId: null });
    setFilaAbierta(rowId);
  }

  return (
    <div>
      <div className="border border-border rounded-xl overflow-visible bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-3 py-2.5">Descripción</th>
              <th className="text-left font-medium px-3 py-2.5 w-20">Unidad</th>
              <th className="text-left font-medium px-3 py-2.5 w-20">Cant.</th>
              <th className="text-left font-medium px-3 py-2.5 w-28">Precio</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea) => {
              const query = linea.nombre.trim().toLowerCase();
              const sugerencias =
                filaAbierta === linea.rowId
                  ? (query
                      ? catalogo.filter((c) => c.nombre.toLowerCase().includes(query))
                      : catalogo
                    ).slice(0, 30)
                  : [];
              const esNuevo = !linea.equipoId && linea.nombre.trim().length >= 2;

              return (
                <tr key={linea.rowId} className="border-b border-border last:border-0 relative">
                  <td className="px-3 py-2 relative">
                    <input
                      value={linea.nombre}
                      onFocus={() => setFilaAbierta(linea.rowId)}
                      onChange={(e) => escribirNombre(linea.rowId, e.target.value)}
                      onBlur={() => setTimeout(() => setFilaAbierta(null), 150)}
                      placeholder="Descripción del equipo..."
                      className="w-full bg-transparent text-sm focus:outline-none"
                    />
                    {esNuevo && !permitirLibre && (
                      <span className="text-accent text-[11px] block">
                        Nuevo equipo — se creará al guardar
                      </span>
                    )}
                    {esNuevo && permitirLibre && (
                      <label className="flex items-center gap-1.5 text-[11px] mt-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={linea.agregarAMaestros}
                          onChange={(e) =>
                            actualizar(linea.rowId, {
                              agregarAMaestros: e.target.checked,
                            })
                          }
                          className="h-3.5 w-3.5 accent-accent"
                        />
                        <span className="text-accent">
                          {linea.agregarAMaestros
                            ? "Se agregará a Equipos"
                            : "Solo para esta cotización"}
                        </span>
                      </label>
                    )}
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
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={linea.unidad}
                      onChange={(e) => actualizar(linea.rowId, { unidad: e.target.value })}
                      placeholder="un"
                      className="w-full bg-transparent text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={linea.cantidadPorUnidad}
                      onChange={(e) =>
                        actualizar(linea.rowId, {
                          cantidadPorUnidad: Number(e.target.value),
                        })
                      }
                      className="w-full bg-transparent text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={linea.costoUnitario}
                      disabled={!!linea.equipoId}
                      onChange={(e) =>
                        actualizar(linea.rowId, { costoUnitario: Number(e.target.value) })
                      }
                      className="w-full bg-transparent text-sm focus:outline-none disabled:text-text-dim"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => quitar(linea.rowId)} className="text-text-dim">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {lineas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-text-dim text-sm">
                  Aún no has agregado equipos a este ítem.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={agregarFila} className="mt-2 text-accent text-sm font-medium">
        + Agregar equipo
      </button>
      <p className="text-text-dim text-xs mt-2">
        Escribe el nombre: si coincide con un equipo ya cargado, se vincula solo (unidad y
        precio se completan y quedan en vivo).
      </p>
    </div>
  );
}
