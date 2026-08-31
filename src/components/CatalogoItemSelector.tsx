"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import MaterialesEditor, { type MaterialLinea } from "@/components/MaterialesEditor";
import EquiposItemEditor, { type EquipoLinea } from "@/components/EquiposItemEditor";

export type CatalogoItemOption = {
  id: string;
  nombre_item: string;
  unidad: string;
  costo_mano_obra_referencial: number;
  categoria: string;
};

export type ItemCotizacionLinea = {
  rowId: string;
  catalogoItemId: string | null;
  nombre: string;
  unidad: string;
  cantidad: number;
  costoManoObraUnitario: number;
  materiales: MaterialLinea[];
  equipos: EquipoLinea[];
  expandido: boolean;
  agregarACatalogo: boolean;
};

export default function CatalogoItemSelector({
  lineas,
  onChange,
}: {
  lineas: ItemCotizacionLinea[];
  onChange: (lineas: ItemCotizacionLinea[]) => void;
}) {
  const supabase = createClient();
  const [catalogo, setCatalogo] = useState<CatalogoItemOption[]>([]);
  const [filaAbierta, setFilaAbierta] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("catalogo_items")
        .select("id, nombre_item, unidad, costo_mano_obra_referencial, categoria")
        .order("nombre_item");
      setCatalogo(data ?? []);
    })();
  }, []);

  function actualizar(rowId: string, patch: Partial<ItemCotizacionLinea>) {
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
        catalogoItemId: null,
        nombre: "",
        unidad: "unidad",
        cantidad: 1,
        costoManoObraUnitario: 0,
        materiales: [],
        equipos: [],
        expandido: true,
        agregarACatalogo: false,
      },
    ]);
    setFilaAbierta(nuevoId);
  }

  async function elegirItem(rowId: string, item: CatalogoItemOption) {
    const { data: vinculosMat } = await supabase
      .from("catalogo_item_materiales")
      .select("cantidad_por_unidad, materiales_maestros(id, nombre, unidad, costo_referencial)")
      .eq("catalogo_item_id", item.id);

    const materiales: MaterialLinea[] = (vinculosMat ?? []).map((v) => {
      const m = v.materiales_maestros as unknown as {
        id: string;
        nombre: string;
        unidad: string;
        costo_referencial: number;
      };
      return {
        rowId: crypto.randomUUID(),
        materialId: m.id,
        nombre: m.nombre,
        unidad: m.unidad,
        costoUnitario: Number(m.costo_referencial),
        cantidadPorUnidad: Number(v.cantidad_por_unidad),
        agregarAMaestros: true,
      };
    });

    const { data: vinculosEq } = await supabase
      .from("catalogo_item_equipos")
      .select("cantidad_por_unidad, equipos_maestros(id, nombre, marca, unidad, precio_unitario)")
      .eq("catalogo_item_id", item.id);

    const equipos: EquipoLinea[] = (vinculosEq ?? []).map((v) => {
      const eq = v.equipos_maestros as unknown as {
        id: string;
        nombre: string;
        marca: string | null;
        unidad: string;
        precio_unitario: number;
      };
      return {
        rowId: crypto.randomUUID(),
        equipoId: eq.id,
        nombre: eq.marca ? `${eq.nombre} (${eq.marca})` : eq.nombre,
        unidad: eq.unidad,
        costoUnitario: Number(eq.precio_unitario),
        cantidadPorUnidad: Number(v.cantidad_por_unidad),
        agregarAMaestros: true,
      };
    });

    actualizar(rowId, {
      catalogoItemId: item.id,
      nombre: item.nombre_item,
      unidad: item.unidad,
      costoManoObraUnitario: Number(item.costo_mano_obra_referencial),
      materiales,
      equipos,
      expandido: true,
    });
    setFilaAbierta(null);
  }

  return (
    <div className="space-y-3">
      {lineas.map((linea) => {
        const query = linea.nombre.trim().toLowerCase();
        const sugerencias =
          filaAbierta === linea.rowId
            ? (query
                ? catalogo.filter((c) => c.nombre_item.toLowerCase().includes(query))
                : catalogo
              ).slice(0, 30)
            : [];

        const totalMaterialUnitario = linea.materiales.reduce(
          (s, m) => s + m.costoUnitario * m.cantidadPorUnidad,
          0
        );
        const totalEquipoUnitario = linea.equipos.reduce(
          (s, e) => s + e.costoUnitario * e.cantidadPorUnidad,
          0
        );
        const precioUnitario =
          linea.costoManoObraUnitario + totalMaterialUnitario + totalEquipoUnitario;
        const totalLinea = linea.cantidad * precioUnitario;

        return (
          <div key={linea.rowId} className="border border-border rounded-xl bg-surface p-3">
            <div className="flex gap-2 items-start">
              <div className="flex-1 relative">
                <input
                  value={linea.nombre}
                  onFocus={() => setFilaAbierta(linea.rowId)}
                  onChange={(e) => {
                    actualizar(linea.rowId, { nombre: e.target.value, catalogoItemId: null });
                    setFilaAbierta(linea.rowId);
                  }}
                  onBlur={() => setTimeout(() => setFilaAbierta(null), 150)}
                  placeholder="Buscar ítem del catálogo..."
                  className="w-full bg-transparent text-base font-medium focus:outline-none"
                />
                {filaAbierta === linea.rowId && sugerencias.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {sugerencias.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => elegirItem(linea.rowId, c)}
                        className="w-full text-left px-3 py-2.5 text-base hover:bg-surface-raised"
                      >
                        <span>{c.nombre_item}</span>
                        <span className="text-text-dim text-xs block">{c.categoria}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {linea.nombre.trim() && (
                <button
                  onClick={() => actualizar(linea.rowId, { expandido: !linea.expandido })}
                  className="text-text-dim p-1"
                >
                  {linea.expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              )}
              <button onClick={() => quitar(linea.rowId)} className="text-text-dim p-1">
                <Trash2 size={16} />
              </button>
            </div>

            {linea.nombre.trim() && linea.expandido && (
              <div className="mt-4 space-y-4">
                {!linea.catalogoItemId && (
                  <label className="flex items-center gap-1.5 text-accent text-xs -mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linea.agregarACatalogo}
                      onChange={(e) =>
                        actualizar(linea.rowId, { agregarACatalogo: e.target.checked })
                      }
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    {linea.agregarACatalogo
                      ? "Se agregará a tu Catálogo de ítems"
                      : "Ítem nuevo — se usa solo en esta cotización"}
                  </label>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                      Unidad
                    </label>
                    <input
                      value={linea.unidad}
                      onChange={(e) => actualizar(linea.rowId, { unidad: e.target.value })}
                      placeholder="unidad"
                      className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={linea.cantidad}
                      onChange={(e) =>
                        actualizar(linea.rowId, { cantidad: Number(e.target.value) })
                      }
                      className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                      Precio (mano de obra)
                    </label>
                    <input
                      type="number"
                      value={linea.costoManoObraUnitario}
                      onChange={(e) =>
                        actualizar(linea.rowId, {
                          costoManoObraUnitario: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-text-dim uppercase tracking-wide mb-2">
                    Materiales e insumos
                  </h4>
                  <MaterialesEditor
                    lineas={linea.materiales}
                    onChange={(materiales) => actualizar(linea.rowId, { materiales })}
                    permitirLibre
                  />
                </div>

                <div>
                  <h4 className="text-xs font-medium text-text-dim uppercase tracking-wide mb-2">
                    Equipos (cuando aplique)
                  </h4>
                  <EquiposItemEditor
                    lineas={linea.equipos}
                    onChange={(equipos) => actualizar(linea.rowId, { equipos })}
                    permitirLibre
                  />
                </div>

                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between text-xs text-text-dim">
                    <span>Mano de obra</span>
                    <span>${linea.costoManoObraUnitario.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-text-dim">
                    <span>Materiales</span>
                    <span>${totalMaterialUnitario.toLocaleString("es-CL")}</span>
                  </div>
                  {totalEquipoUnitario > 0 && (
                    <div className="flex justify-between text-xs text-text-dim">
                      <span>Equipos</span>
                      <span>${totalEquipoUnitario.toLocaleString("es-CL")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium pt-1">
                    <span>Precio unitario</span>
                    <span>${precioUnitario.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between font-display text-base pt-1 border-t border-border">
                    <span>Total línea ({linea.cantidad} {linea.unidad})</span>
                    <span>${totalLinea.toLocaleString("es-CL")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={agregarFila} className="text-accent text-sm font-medium">
        + Agregar ítem
      </button>
    </div>
  );
}
