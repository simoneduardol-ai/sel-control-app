"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

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
  costoMaterialUnitario: number; // suma calculada de materiales del ítem × cantidad_por_unidad
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
        costoMaterialUnitario: 0,
      },
    ]);
    setFilaAbierta(nuevoId);
  }

  async function elegirItem(rowId: string, item: CatalogoItemOption) {
    // Calcular el costo de materiales del ítem (suma cantidad_por_unidad × costo_referencial)
    const { data: vinculos } = await supabase
      .from("catalogo_item_materiales")
      .select("cantidad_por_unidad, materiales_maestros(costo_referencial)")
      .eq("catalogo_item_id", item.id);

    const costoMaterial = (vinculos ?? []).reduce((sum, v) => {
      const m = v.materiales_maestros as unknown as { costo_referencial: number } | null;
      return sum + Number(v.cantidad_por_unidad) * Number(m?.costo_referencial ?? 0);
    }, 0);

    actualizar(rowId, {
      catalogoItemId: item.id,
      nombre: item.nombre_item,
      unidad: item.unidad,
      costoManoObraUnitario: Number(item.costo_mano_obra_referencial),
      costoMaterialUnitario: costoMaterial,
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
                  ? catalogo.filter((c) =>
                      c.nombre_item.toLowerCase().includes(query)
                    )
                  : catalogo
                ).slice(0, 30)
              : [];

          const totalLinea =
            linea.cantidad * (linea.costoManoObraUnitario + linea.costoMaterialUnitario);

          return (
            <div
              key={linea.rowId}
              className="border border-border rounded-xl bg-surface p-3 relative"
            >
              <div className="flex gap-2 items-start">
                <div className="flex-1 relative">
                  <input
                    value={linea.nombre}
                    onFocus={() => setFilaAbierta(linea.rowId)}
                    onChange={(e) => {
                      actualizar(linea.rowId, {
                        nombre: e.target.value,
                        catalogoItemId: null,
                      });
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
                          <span className="text-text-dim text-xs block">
                            {c.categoria}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => quitar(linea.rowId)} className="text-text-dim p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              {linea.catalogoItemId && (
                <div className="flex items-center gap-3 mt-2">
                  <label className="text-xs text-text-dim">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={linea.cantidad}
                    onChange={(e) =>
                      actualizar(linea.rowId, { cantidad: Number(e.target.value) })
                    }
                    className="w-20 rounded-lg bg-bg border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-text-dim text-xs">{linea.unidad}</span>
                  <span className="ml-auto text-sm font-medium">
                    ${totalLinea.toLocaleString("es-CL")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={agregarFila} className="mt-2 text-accent text-sm font-medium">
        + Agregar ítem
      </button>
    </div>
  );
}
