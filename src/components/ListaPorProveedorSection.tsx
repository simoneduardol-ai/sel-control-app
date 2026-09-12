"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, ImageDown } from "lucide-react";
import { generarImagenLista, descargarImagen } from "@/lib/imagenLista";

type Item = { nombre: string; cantidad: number; unidad: string };
type Grupo = { codigo: string; nombreProveedor: string; items: Item[] };

export default function ListaPorProveedorSection({ cotizacionId }: { cotizacionId: string }) {
  const supabase = createClient();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [copiadoCodigo, setCopiadoCodigo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: mats } = await supabase
        .from("cotizacion_item_materiales")
        .select(
          "material_id, cantidad_total, proveedor_codigo, nombre_libre, unidad_libre, materiales_maestros(nombre, unidad), cotizacion_items_apu!inner(etapa_id, cotizacion_etapas!inner(cotizacion_id))"
        )
        .eq("cotizacion_items_apu.cotizacion_etapas.cotizacion_id", cotizacionId)
        .not("proveedor_codigo", "is", null);

      const { data: eqs } = await supabase
        .from("cotizacion_item_equipos")
        .select(
          "equipo_id, cantidad_total, proveedor_codigo, nombre_libre, unidad_libre, equipos_maestros(nombre, unidad), cotizacion_items_apu!inner(etapa_id, cotizacion_etapas!inner(cotizacion_id))"
        )
        .eq("cotizacion_items_apu.cotizacion_etapas.cotizacion_id", cotizacionId)
        .not("proveedor_codigo", "is", null);

      const { data: codigosData } = await supabase
        .from("proveedores")
        .select("codigo, nombre")
        .not("codigo", "is", null);
      const nombreDeCodigo: Record<string, string> = {};
      (codigosData ?? []).forEach((c) => {
        if (c.codigo) nombreDeCodigo[c.codigo] = c.nombre;
      });

      // agrupar por código, sumando cantidades del mismo material/equipo
      const mapa: Record<string, Record<string, Item>> = {};

      function agregar(
        codigo: string,
        nombre: string,
        unidad: string,
        cantidad: number
      ) {
        if (!mapa[codigo]) mapa[codigo] = {};
        const clave = nombre;
        if (!mapa[codigo][clave]) {
          mapa[codigo][clave] = { nombre, unidad, cantidad: 0 };
        }
        mapa[codigo][clave].cantidad += cantidad;
      }

      type FilaMaterial = {
        proveedor_codigo: string | null;
        cantidad_total: number;
        nombre_libre: string | null;
        unidad_libre: string | null;
        materiales_maestros: { nombre: string; unidad: string } | null;
      };
      (mats ?? []).forEach((m) => {
        const fila = m as unknown as FilaMaterial;
        if (!fila.proveedor_codigo) return;
        const nombre = fila.materiales_maestros?.nombre ?? fila.nombre_libre ?? "Sin nombre";
        const unidad = fila.materiales_maestros?.unidad ?? fila.unidad_libre ?? "un";
        agregar(fila.proveedor_codigo, nombre, unidad, Number(fila.cantidad_total));
      });

      type FilaEquipo = {
        proveedor_codigo: string | null;
        cantidad_total: number;
        nombre_libre: string | null;
        unidad_libre: string | null;
        equipos_maestros: { nombre: string; unidad: string } | null;
      };
      (eqs ?? []).forEach((e) => {
        const fila = e as unknown as FilaEquipo;
        if (!fila.proveedor_codigo) return;
        const nombre = fila.equipos_maestros?.nombre ?? fila.nombre_libre ?? "Sin nombre";
        const unidad = fila.equipos_maestros?.unidad ?? fila.unidad_libre ?? "un";
        agregar(fila.proveedor_codigo, nombre, unidad, Number(fila.cantidad_total));
      });

      const gruposArmados: Grupo[] = Object.entries(mapa)
        .map(([codigo, items]) => ({
          codigo,
          nombreProveedor: nombreDeCodigo[codigo] ?? codigo,
          items: Object.values(items),
        }))
        .sort((a, b) => a.codigo.localeCompare(b.codigo));

      setGrupos(gruposArmados);
      setCargando(false);
    })();
  }, [cotizacionId]);

  function copiar(grupo: Grupo) {
    const texto = grupo.items.map((i) => `${i.nombre} — ${i.cantidad} ${i.unidad}`).join("\n");
    navigator.clipboard.writeText(texto);
    setCopiadoCodigo(grupo.codigo);
    setTimeout(() => setCopiadoCodigo(null), 2000);
  }

  function descargar(grupo: Grupo) {
    const dataUrl = generarImagenLista({
      titulo: `Lista para ${grupo.nombreProveedor}`,
      subtitulo: `Código ${grupo.codigo} — de la cotización acordada`,
      filas: grupo.items,
    });
    descargarImagen(dataUrl, `lista-${grupo.codigo}.png`);
  }

  if (cargando || grupos.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2">
        Lista de compra por proveedor
      </h2>
      <p className="text-text-dim text-xs mb-3">
        Agrupa lo ya acordado en &quot;Precios definitivos&quot; por cada proveedor asignado —
        lista para mandar por separado a cada uno.
      </p>
      <div className="space-y-3">
        {grupos.map((grupo) => (
          <div key={grupo.codigo} className="border border-border rounded-xl bg-surface p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {grupo.nombreProveedor}{" "}
                <span className="text-text-dim font-normal">({grupo.codigo})</span>
              </span>
            </div>
            <div className="divide-y divide-border mb-2">
              {grupo.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 text-sm">
                  <span>{item.nombre}</span>
                  <span className="text-text-dim">
                    {item.cantidad} {item.unidad}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => copiar(grupo)}
                className="flex items-center gap-1.5 text-accent text-xs font-medium"
              >
                {copiadoCodigo === grupo.codigo ? <Check size={14} /> : <Copy size={14} />}
                {copiadoCodigo === grupo.codigo ? "Copiado" : "Copiar como texto"}
              </button>
              <button
                onClick={() => descargar(grupo)}
                className="flex items-center gap-1.5 text-accent text-xs font-medium"
              >
                <ImageDown size={14} /> Descargar imagen (WhatsApp)
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
