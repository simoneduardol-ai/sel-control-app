"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export type MaterialLinea = {
  rowId: string;
  materialId: string | null;
  nombre: string;
  unidad: string;
  costoUnitario: number;
  cantidadPorUnidad: number;
  agregarAMaestros: boolean;
};

type MaterialMaestro = {
  id: string;
  nombre: string;
  unidad: string;
  costo_referencial: number;
};

export default function MaterialesEditor({
  lineas,
  onChange,
  permitirLibre = false,
}: {
  lineas: MaterialLinea[];
  onChange: (lineas: MaterialLinea[]) => void;
  /** Si es true (dentro de una cotización), permite dejar el material "solo
   * para esta cotización" sin guardarlo en Materiales maestros. Si es false
   * (dentro del Catálogo), siempre se crea en Materiales maestros. */
  permitirLibre?: boolean;
}) {
  const supabase = createClient();
  const [catalogo, setCatalogo] = useState<MaterialMaestro[]>([]);
  const [filaAbierta, setFilaAbierta] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("materiales_maestros")
        .select("id, nombre, unidad, costo_referencial")
        .order("nombre");
      setCatalogo(data ?? []);
    })();
  }, []);

  function actualizar(rowId: string, patch: Partial<MaterialLinea>) {
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
        materialId: null,
        nombre: "",
        unidad: "",
        costoUnitario: 0,
        cantidadPorUnidad: 1,
        agregarAMaestros: true,
      },
    ]);
    setFilaAbierta(nuevoId);
  }

  function elegirMaterial(rowId: string, m: MaterialMaestro) {
    actualizar(rowId, {
      materialId: m.id,
      nombre: m.nombre,
      unidad: m.unidad,
      costoUnitario: Number(m.costo_referencial),
    });
    setFilaAbierta(null);
  }

  function escribirNombre(rowId: string, texto: string) {
    actualizar(rowId, { nombre: texto, materialId: null });
    setFilaAbierta(rowId);
  }

  return (
    <div>
      <div className="border border-border rounded-xl overflow-visible bg-surface">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-3 py-2.5">Material</th>
              <th className="text-left font-medium px-3 py-2.5 w-20">Unidad</th>
              <th className="text-left font-medium px-3 py-2.5 w-28">
                Cant. por unidad
              </th>
              <th className="text-left font-medium px-3 py-2.5 w-28">
                Costo unitario
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea) => {
              const query = linea.nombre.trim().toLowerCase();
              const sugerencias =
                filaAbierta === linea.rowId
                  ? (query
                      ? catalogo.filter((m) =>
                          m.nombre.toLowerCase().includes(query)
                        )
                      : catalogo
                    ).slice(0, 30)
                  : [];
              const esNuevo = !linea.materialId && linea.nombre.trim().length >= 2;

              return (
                <tr key={linea.rowId} className="border-b border-border last:border-0 relative">
                  <td className="px-3 py-2.5 relative">
                    <input
                      value={linea.nombre}
                      onFocus={() => setFilaAbierta(linea.rowId)}
                      onChange={(e) => escribirNombre(linea.rowId, e.target.value)}
                      onBlur={() => setTimeout(() => setFilaAbierta(null), 150)}
                      placeholder="Buscar o escribir material..."
                      className="w-full bg-transparent text-base focus:outline-none"
                    />
                    {esNuevo && !permitirLibre && (
                      <span className="text-accent text-xs block">
                        Nuevo material — se creará al guardar
                      </span>
                    )}
                    {esNuevo && permitirLibre && (
                      <label className="flex items-center gap-1.5 text-xs mt-0.5 cursor-pointer">
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
                            ? "Se agregará a Materiales maestros"
                            : "Solo para esta cotización"}
                        </span>
                      </label>
                    )}

                    {filaAbierta === linea.rowId && sugerencias.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {sugerencias.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onMouseDown={() => elegirMaterial(linea.rowId, m)}
                            className="w-full text-left px-3 py-2.5 text-base hover:bg-surface-raised flex items-center justify-between gap-3"
                          >
                            <span>{m.nombre}</span>
                            <span className="text-text-dim text-sm shrink-0">
                              {m.unidad} · ${Number(m.costo_referencial).toLocaleString("es-CL")}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      value={linea.unidad}
                      onChange={(e) =>
                        actualizar(linea.rowId, { unidad: e.target.value })
                      }
                      placeholder="un"
                      className="w-full bg-transparent text-base focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      step="0.01"
                      value={linea.cantidadPorUnidad}
                      onChange={(e) =>
                        actualizar(linea.rowId, {
                          cantidadPorUnidad: Number(e.target.value),
                        })
                      }
                      className="w-full bg-transparent text-base focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      value={linea.costoUnitario}
                      disabled={!!linea.materialId}
                      onChange={(e) =>
                        actualizar(linea.rowId, {
                          costoUnitario: Number(e.target.value),
                        })
                      }
                      className="w-full bg-transparent text-base focus:outline-none disabled:text-text-dim"
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <button
                      onClick={() => quitar(linea.rowId)}
                      className="text-text-dim"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {lineas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-text-dim text-base">
                  Aún no has agregado materiales a este ítem.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={agregarFila}
        className="mt-2 text-accent text-base font-medium"
      >
        + Agregar material
      </button>
      <p className="text-text-dim text-sm mt-2">
        Haz clic en el campo para ver la lista completa de materiales en orden
        alfabético, o escribe para filtrar. Si eliges uno existente queda
        vinculado en vivo (editar el precio en Materiales maestros lo actualiza
        aquí también).
      </p>
    </div>
  );
}
