"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export type MaterialLinea = {
  rowId: string; // id local, no de BD, para el key de React
  materialId: string | null; // null hasta que se vincula o crea
  nombre: string;
  unidad: string;
  costoUnitario: number;
  cantidadPorUnidad: number;
};

export default function MaterialesEditor({
  lineas,
  onChange,
}: {
  lineas: MaterialLinea[];
  onChange: (lineas: MaterialLinea[]) => void;
}) {
  const supabase = createClient();

  function actualizar(rowId: string, patch: Partial<MaterialLinea>) {
    onChange(lineas.map((l) => (l.rowId === rowId ? { ...l, ...patch } : l)));
  }

  function quitar(rowId: string) {
    onChange(lineas.filter((l) => l.rowId !== rowId));
  }

  function agregarFila() {
    onChange([
      ...lineas,
      {
        rowId: crypto.randomUUID(),
        materialId: null,
        nombre: "",
        unidad: "",
        costoUnitario: 0,
        cantidadPorUnidad: 1,
      },
    ]);
  }

  async function buscarMaterial(rowId: string, texto: string) {
    actualizar(rowId, { nombre: texto, materialId: null });
    if (texto.trim().length < 2) return;

    const { data } = await supabase
      .from("materiales_maestros")
      .select("id, nombre, unidad, costo_referencial")
      .ilike("nombre", texto.trim())
      .limit(1);

    if (data && data.length > 0) {
      const m = data[0];
      actualizar(rowId, {
        materialId: m.id,
        nombre: m.nombre,
        unidad: m.unidad,
        costoUnitario: Number(m.costo_referencial),
      });
    }
  }

  return (
    <div>
      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        <table className="w-full text-sm">
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
            {lineas.map((linea) => (
              <tr key={linea.rowId} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <input
                    value={linea.nombre}
                    onChange={(e) => buscarMaterial(linea.rowId, e.target.value)}
                    placeholder="Escribe el nombre..."
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                  {!linea.materialId && linea.nombre.trim().length >= 2 && (
                    <span className="text-accent text-[11px]">
                      Nuevo material — se creará al guardar
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    value={linea.unidad}
                    onChange={(e) =>
                      actualizar(linea.rowId, { unidad: e.target.value })
                    }
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
                    disabled={!!linea.materialId}
                    onChange={(e) =>
                      actualizar(linea.rowId, {
                        costoUnitario: Number(e.target.value),
                      })
                    }
                    className="w-full bg-transparent text-sm focus:outline-none disabled:text-text-dim"
                  />
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => quitar(linea.rowId)}
                    className="text-text-dim"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {lineas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-text-dim text-sm">
                  Aún no has agregado materiales a este ítem.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={agregarFila}
        className="mt-2 text-accent text-sm font-medium"
      >
        + Agregar material
      </button>
      <p className="text-text-dim text-xs mt-2">
        El nombre se busca en Materiales maestros: si coincide, la unidad y el precio
        se completan solos y quedan vinculados (editar el precio en Materiales
        maestros lo actualiza aquí también). Si el nombre es nuevo, se crea un
        material maestro con lo que escribas.
      </p>
    </div>
  );
}
