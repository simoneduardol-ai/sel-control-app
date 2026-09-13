"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PackageCheck } from "lucide-react";

type Material = { clave: string; nombre: string; cantidad: number; unidad: string };

export default function ChecklistMaterialesObra({
  obraId,
  cotizacionId,
}: {
  obraId: string;
  cotizacionId: string;
}) {
  const supabase = createClient();
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [comprados, setComprados] = useState<Record<string, boolean>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: mats } = await supabase
        .from("cotizacion_item_materiales")
        .select(
          "material_id, cantidad_total, nombre_libre, unidad_libre, materiales_maestros(nombre, unidad), cotizacion_items_apu!inner(etapa_id, cotizacion_etapas!inner(cotizacion_id))"
        )
        .eq("cotizacion_items_apu.cotizacion_etapas.cotizacion_id", cotizacionId);

      type Fila = {
        material_id: string | null;
        cantidad_total: number;
        nombre_libre: string | null;
        unidad_libre: string | null;
        materiales_maestros: { nombre: string; unidad: string } | null;
      };

      const mapa: Record<string, Material> = {};
      (mats ?? []).forEach((m) => {
        const fila = m as unknown as Fila;
        const nombre = fila.materiales_maestros?.nombre ?? fila.nombre_libre ?? "Sin nombre";
        const unidad = fila.materiales_maestros?.unidad ?? fila.unidad_libre ?? "un";
        const clave = fila.material_id ?? nombre;
        if (!mapa[clave]) mapa[clave] = { clave, nombre, unidad, cantidad: 0 };
        mapa[clave].cantidad += Number(fila.cantidad_total);
      });

      setMateriales(Object.values(mapa).sort((a, b) => a.nombre.localeCompare(b.nombre)));

      const { data: obra } = await supabase
        .from("obras_ejecucion")
        .select("lista_materiales_comprados")
        .eq("id", obraId)
        .single();
      setComprados((obra?.lista_materiales_comprados as Record<string, boolean>) ?? {});
      setCargando(false);
    })();
  }, [obraId, cotizacionId]);

  async function toggle(clave: string) {
    const nuevo = { ...comprados, [clave]: !comprados[clave] };
    setComprados(nuevo);
    await supabase
      .from("obras_ejecucion")
      .update({ lista_materiales_comprados: nuevo })
      .eq("id", obraId);
  }

  if (cargando || materiales.length === 0) return null;

  const totalComprados = materiales.filter((m) => comprados[m.clave]).length;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-sm uppercase tracking-wide text-text-dim flex items-center gap-1.5">
          <PackageCheck size={14} /> Materiales — comprados / en bodega
        </h2>
        <span className="text-text-dim text-xs">
          {totalComprados}/{materiales.length}
        </span>
      </div>
      <div className="border border-border rounded-xl bg-surface divide-y divide-border">
        {materiales.map((m) => (
          <label
            key={m.clave}
            className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={!!comprados[m.clave]}
              onChange={() => toggle(m.clave)}
              className="h-4 w-4 accent-accent shrink-0"
            />
            <span className={comprados[m.clave] ? "line-through text-text-dim flex-1" : "flex-1"}>
              {m.nombre}
            </span>
            <span className="text-text-dim text-xs shrink-0">
              {m.cantidad} {m.unidad}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
