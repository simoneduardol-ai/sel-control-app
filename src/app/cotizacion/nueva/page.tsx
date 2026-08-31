"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ClienteSelector, { type ClienteOption } from "@/components/ClienteSelector";
import CatalogoItemSelector, {
  type ItemCotizacionLinea,
} from "@/components/CatalogoItemSelector";

type Etapa = {
  rowId: string;
  nombre: string;
  items: ItemCotizacionLinea[];
};

function totalesLinea(item: ItemCotizacionLinea) {
  const materiales = item.materiales.reduce(
    (s, m) => s + m.costoUnitario * m.cantidadPorUnidad,
    0
  );
  const equipos = item.equipos.reduce((s, e) => s + e.costoUnitario * e.cantidadPorUnidad, 0);
  return {
    manoObra: item.cantidad * item.costoManoObraUnitario,
    materiales: item.cantidad * materiales,
    equipos: item.cantidad * equipos,
  };
}

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [cliente, setCliente] = useState<ClienteOption | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([
    { rowId: crypto.randomUUID(), nombre: "", items: [] },
  ]);
  const [mostrarPrecioPorItem, setMostrarPrecioPorItem] = useState(false);
  const [mostrarTotalMateriales, setMostrarTotalMateriales] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizarEtapa(rowId: string, patch: Partial<Etapa>) {
    setEtapas((prev) => prev.map((e) => (e.rowId === rowId ? { ...e, ...patch } : e)));
  }

  function agregarEtapa() {
    setEtapas((prev) => [...prev, { rowId: crypto.randomUUID(), nombre: "", items: [] }]);
  }

  function quitarEtapa(rowId: string) {
    setEtapas((prev) => prev.filter((e) => e.rowId !== rowId));
  }

  let totalManoObra = 0;
  let totalMateriales = 0;
  let totalEquipos = 0;
  for (const etapa of etapas) {
    for (const item of etapa.items) {
      const t = totalesLinea(item);
      totalManoObra += t.manoObra;
      totalMateriales += t.materiales;
      totalEquipos += t.equipos;
    }
  }
  const totalGeneral = totalManoObra + totalMateriales + totalEquipos;

  async function guardar() {
    if (!cliente) {
      setError("Selecciona un cliente primero.");
      return;
    }
    const etapasConItems = etapas.filter(
      (e) => e.nombre.trim() && e.items.some((i) => i.catalogoItemId)
    );
    if (etapasConItems.length === 0) {
      setError("Agrega al menos una etapa con un ítem.");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const { data: cotizacion, error: errCot } = await supabase
        .from("cotizaciones")
        .insert({
          cliente_id: cliente.id,
          estado: "BORRADOR",
          total_materiales: totalMateriales,
          total_mano_obra: totalManoObra,
          total_equipos: totalEquipos,
          mostrar_precio_por_item: mostrarPrecioPorItem,
          mostrar_total_materiales: mostrarTotalMateriales,
        })
        .select("id")
        .single();
      if (errCot) throw errCot;

      for (let idx = 0; idx < etapasConItems.length; idx++) {
        const etapa = etapasConItems[idx];
        const { data: etapaRow, error: errEtapa } = await supabase
          .from("cotizacion_etapas")
          .insert({
            cotizacion_id: cotizacion.id,
            nombre_etapa: etapa.nombre.trim(),
            orden: idx,
          })
          .select("id")
          .single();
        if (errEtapa) throw errEtapa;

        for (const item of etapa.items) {
          if (!item.catalogoItemId) continue;

          const totalMaterialUnitario = item.materiales.reduce(
            (s, m) => s + m.costoUnitario * m.cantidadPorUnidad,
            0
          );

          const { data: itemRow, error: errItem } = await supabase
            .from("cotizacion_items_apu")
            .insert({
              etapa_id: etapaRow.id,
              catalogo_item_id: item.catalogoItemId,
              descripcion_item: item.nombre,
              cantidad: item.cantidad,
              unidad: item.unidad,
              costo_material_unitario: totalMaterialUnitario,
              costo_mano_obra_unitario: item.costoManoObraUnitario,
            })
            .select("id")
            .single();
          if (errItem) throw errItem;

          // Guardar materiales editados de esta línea (creando nuevos si hace falta)
          for (const linea of item.materiales) {
            if (!linea.nombre.trim()) continue;
            let materialId = linea.materialId;

            if (!materialId) {
              const { data: nuevoMaterial, error: errMat } = await supabase
                .from("materiales_maestros")
                .insert({
                  nombre: linea.nombre.trim(),
                  unidad: linea.unidad || "un",
                  costo_referencial: linea.costoUnitario,
                })
                .select("id")
                .single();
              if (errMat) throw errMat;
              materialId = nuevoMaterial.id;
            }

            await supabase.from("cotizacion_item_materiales").insert({
              cotizacion_item_id: itemRow.id,
              material_id: materialId,
              cantidad_total: linea.cantidadPorUnidad * item.cantidad,
              costo_unitario: linea.costoUnitario,
            });
          }

          // Guardar equipos editados de esta línea (creando nuevos si hace falta)
          for (const linea of item.equipos) {
            if (!linea.nombre.trim()) continue;
            let equipoId = linea.equipoId;

            if (!equipoId) {
              const { data: nuevoEquipo, error: errEq } = await supabase
                .from("equipos_maestros")
                .insert({
                  nombre: linea.nombre.trim(),
                  unidad: linea.unidad || "un",
                  precio_unitario: linea.costoUnitario,
                })
                .select("id")
                .single();
              if (errEq) throw errEq;
              equipoId = nuevoEquipo.id;
            }

            await supabase.from("cotizacion_item_equipos").insert({
              cotizacion_item_id: itemRow.id,
              equipo_id: equipoId,
              cantidad_total: linea.cantidadPorUnidad * item.cantidad,
              costo_unitario: linea.costoUnitario,
            });
          }
        }
      }

      router.push(`/cotizacion/${cotizacion.id}`);
      router.refresh();
    } catch {
      setError("No se pudo guardar la cotización. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-32">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link href="/cotizacion" className="p-1 -ml-1 text-text-dim">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-display text-lg">Nueva cotización</h1>
        </header>

        <div className="px-5 md:px-8 py-6 max-w-6xl md:flex md:gap-8 md:items-start">
          <div className="flex-1 min-w-0 space-y-6">
            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2">Cliente</h2>
              <ClienteSelector value={cliente} onChange={setCliente} />
            </section>

            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2">Etapas</h2>
              <div className="space-y-4">
                {etapas.map((etapa) => (
                  <div key={etapa.rowId} className="border border-border rounded-xl p-4 bg-surface">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        value={etapa.nombre}
                        onChange={(e) =>
                          actualizarEtapa(etapa.rowId, { nombre: e.target.value })
                        }
                        placeholder="Nombre de la etapa (ej: Empalme, Tablero)"
                        className="flex-1 rounded-lg bg-bg border border-border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      {etapas.length > 1 && (
                        <button
                          onClick={() => quitarEtapa(etapa.rowId)}
                          className="text-text-dim p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <CatalogoItemSelector
                      lineas={etapa.items}
                      onChange={(items) => actualizarEtapa(etapa.rowId, { items })}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={agregarEtapa}
                className="mt-3 flex items-center gap-1.5 text-accent text-sm font-medium"
              >
                <Plus size={16} /> Agregar etapa
              </button>
            </section>

            {error && (
              <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          <div className="md:w-80 md:shrink-0 md:sticky md:top-20 space-y-6 mt-6 md:mt-0">
            <section className="border border-border rounded-xl bg-surface p-4">
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
                Resumen (interno)
              </h2>
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-text-dim">Mano de obra</span>
                <span>${totalManoObra.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-text-dim">Materiales e insumos</span>
                <span>${totalMateriales.toLocaleString("es-CL")}</span>
              </div>
              {totalEquipos > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-border pb-3 mb-3">
                  <span className="text-text-dim">Equipos</span>
                  <span>${totalEquipos.toLocaleString("es-CL")}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-lg border-t border-border pt-3 mt-1">
                <span>Total</span>
                <span>${totalGeneral.toLocaleString("es-CL")}</span>
              </div>
            </section>

            <section className="border border-border rounded-xl bg-surface p-4">
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
                Visibilidad para el cliente
              </h2>
              <label className="flex items-start gap-2.5 text-sm mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarPrecioPorItem}
                  onChange={(e) => setMostrarPrecioPorItem(e.target.checked)}
                  className="h-4 w-4 mt-0.5 accent-accent"
                />
                Mostrar precio unitario y total por ítem en el PDF (por defecto el cliente
                solo ve la descripción de cada ítem y el total general — nunca precios por
                ítem ni desglose de materiales)
              </label>
              <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarTotalMateriales}
                  onChange={(e) => setMostrarTotalMateriales(e.target.checked)}
                  className="h-4 w-4 mt-0.5 accent-accent"
                />
                Mostrar el monto total de materiales (nunca la lista detallada)
              </label>
            </section>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-bg/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 safe-bottom">
        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full max-w-3xl rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base active:scale-[0.98] transition disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cotización en borrador"}
        </button>
      </div>
    </div>
  );
}
