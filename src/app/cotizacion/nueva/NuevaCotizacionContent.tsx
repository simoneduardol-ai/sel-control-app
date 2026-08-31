"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ClienteSelector, { type ClienteOption } from "@/components/ClienteSelector";
import CatalogoItemSelector, {
  type ItemCotizacionLinea,
} from "@/components/CatalogoItemSelector";
import ModalAdvertencia from "@/components/ModalAdvertencia";

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

export default function NuevaCotizacionContent({
  cotizacionId,
}: {
  cotizacionId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const esEdicion = !!cotizacionId;

  const clienteIdPrecargado = searchParams.get("cliente_id");
  const visitaId = searchParams.get("visita_id");

  const [cliente, setCliente] = useState<ClienteOption | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([
    { rowId: crypto.randomUUID(), nombre: "", items: [] },
  ]);
  const [mostrarPrecioPorItem, setMostrarPrecioPorItem] = useState(false);
  const [mostrarTotalMateriales, setMostrarTotalMateriales] = useState(false);
  const [conIva, setConIva] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cargandoDatos, setCargandoDatos] = useState(esEdicion);
  const [estadoActual, setEstadoActual] = useState<string | null>(null);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [edicionBloqueada, setEdicionBloqueada] = useState(false);

  // Precargar cliente cuando viene por link desde una visita
  useEffect(() => {
    if (!clienteIdPrecargado || esEdicion) return;
    (async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nombre, direccion")
        .eq("id", clienteIdPrecargado)
        .single();
      if (data) setCliente(data);
    })();
  }, [clienteIdPrecargado, esEdicion]);

  // Cargar la cotización completa cuando estamos en modo edición
  useEffect(() => {
    if (!cotizacionId) return;
    (async () => {
      const { data: cot } = await supabase
        .from("cotizaciones")
        .select("*, clientes(id, nombre, direccion)")
        .eq("id", cotizacionId)
        .single();

      if (cot) {
        setCliente(cot.clientes as unknown as ClienteOption);
        setMostrarPrecioPorItem(cot.mostrar_precio_por_item);
        setMostrarTotalMateriales(cot.mostrar_total_materiales);
        setConIva(cot.con_iva);
        setEstadoActual(cot.estado);
        if (cot.estado === "APROBADA") {
          setMostrarAdvertencia(true);
          setEdicionBloqueada(true);
        }
      }

      const { data: etapasData } = await supabase
        .from("cotizacion_etapas")
        .select(
          `id, nombre_etapa, orden,
           cotizacion_items_apu (
             id, catalogo_item_id, descripcion_item, cantidad, unidad, costo_mano_obra_unitario, mostrar_precio_individual,
             cotizacion_item_materiales ( material_id, nombre_libre, unidad_libre, costo_unitario, cantidad_total, materiales_maestros(nombre, unidad) ),
             cotizacion_item_equipos ( equipo_id, nombre_libre, unidad_libre, costo_unitario, cantidad_total, equipos_maestros(nombre, unidad, marca) )
           )`
        )
        .eq("cotizacion_id", cotizacionId)
        .order("orden");

      if (etapasData) {
        const etapasCargadas: Etapa[] = etapasData.map((e) => ({
          rowId: crypto.randomUUID(),
          nombre: e.nombre_etapa === "General" ? "" : e.nombre_etapa,
          items: (e.cotizacion_items_apu ?? []).map((it) => {
            const cantidadItem = Number(it.cantidad) || 1;

            const materiales = (it.cotizacion_item_materiales ?? []).map((m) => {
              const maestro = m.materiales_maestros as unknown as {
                nombre: string;
                unidad: string;
              } | null;
              return {
                rowId: crypto.randomUUID(),
                materialId: m.material_id,
                nombre: maestro?.nombre ?? m.nombre_libre ?? "",
                unidad: maestro?.unidad ?? m.unidad_libre ?? "un",
                costoUnitario: Number(m.costo_unitario),
                cantidadPorUnidad: Number(m.cantidad_total) / cantidadItem,
                agregarAMaestros: !!m.material_id,
              };
            });

            const equipos = (it.cotizacion_item_equipos ?? []).map((eq) => {
              const maestro = eq.equipos_maestros as unknown as {
                nombre: string;
                unidad: string;
                marca: string | null;
              } | null;
              return {
                rowId: crypto.randomUUID(),
                equipoId: eq.equipo_id,
                nombre: maestro
                  ? maestro.marca
                    ? `${maestro.nombre} (${maestro.marca})`
                    : maestro.nombre
                  : eq.nombre_libre ?? "",
                unidad: maestro?.unidad ?? eq.unidad_libre ?? "un",
                costoUnitario: Number(eq.costo_unitario),
                cantidadPorUnidad: Number(eq.cantidad_total) / cantidadItem,
                agregarAMaestros: !!eq.equipo_id,
              };
            });

            return {
              rowId: crypto.randomUUID(),
              catalogoItemId: it.catalogo_item_id,
              nombre: it.descripcion_item,
              unidad: it.unidad,
              cantidad: cantidadItem,
              costoManoObraUnitario: Number(it.costo_mano_obra_unitario),
              materiales,
              equipos,
              expandido: false,
              agregarACatalogo: false,
              mostrarPrecioIndividual: !!it.mostrar_precio_individual,
            };
          }),
        }));
        setEtapas(
          etapasCargadas.length > 0
            ? etapasCargadas
            : [{ rowId: crypto.randomUUID(), nombre: "", items: [] }]
        );
      }

      setCargandoDatos(false);
    })();
  }, [cotizacionId]);

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
    const etapasConItems = etapas.filter((e) => e.items.some((i) => i.nombre.trim()));
    if (etapasConItems.length === 0) {
      setError("Agrega al menos una etapa con un ítem.");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      let cotizacionIdFinal: string;

      if (esEdicion && cotizacionId) {
        const { error: errUpdate } = await supabase
          .from("cotizaciones")
          .update({
            total_materiales: totalMateriales,
            total_mano_obra: totalManoObra,
            total_equipos: totalEquipos,
            mostrar_precio_por_item: mostrarPrecioPorItem,
            mostrar_total_materiales: mostrarTotalMateriales,
            con_iva: conIva,
          })
          .eq("id", cotizacionId);
        if (errUpdate) throw errUpdate;

        // Se borran las etapas viejas — la cascada se lleva items, materiales
        // y equipos con ellas — y se recrean con los datos actuales.
        await supabase.from("cotizacion_etapas").delete().eq("cotizacion_id", cotizacionId);

        cotizacionIdFinal = cotizacionId;
      } else {
        const { data: cotizacion, error: errCot } = await supabase
          .from("cotizaciones")
          .insert({
            cliente_id: cliente.id,
            visita_id: visitaId || null,
            estado: "BORRADOR",
            total_materiales: totalMateriales,
            total_mano_obra: totalManoObra,
            total_equipos: totalEquipos,
            mostrar_precio_por_item: mostrarPrecioPorItem,
            mostrar_total_materiales: mostrarTotalMateriales,
            con_iva: conIva,
          })
          .select("id")
          .single();
        if (errCot) throw errCot;
        cotizacionIdFinal = cotizacion.id;
      }

      for (let idx = 0; idx < etapasConItems.length; idx++) {
        const etapa = etapasConItems[idx];
        const { data: etapaRow, error: errEtapa } = await supabase
          .from("cotizacion_etapas")
          .insert({
            cotizacion_id: cotizacionIdFinal,
            nombre_etapa: etapa.nombre.trim() || "General",
            orden: idx,
          })
          .select("id")
          .single();
        if (errEtapa) throw errEtapa;

        for (const item of etapa.items) {
          if (!item.nombre.trim()) continue;

          const totalMaterialUnitario = item.materiales.reduce(
            (s, m) => s + m.costoUnitario * m.cantidadPorUnidad,
            0
          );
          const totalEquipoUnitario = item.equipos.reduce(
            (s, e) => s + e.costoUnitario * e.cantidadPorUnidad,
            0
          );

          // Si el ítem es nuevo y se marcó "agregar a mi Catálogo", lo creamos
          // ahí primero — sus materiales/equipos quedan obligados a Maestros,
          // porque un ítem del Catálogo necesita referencias reales para
          // poder actualizar precios en vivo más adelante.
          let catalogoItemId = item.catalogoItemId;
          const forzarMaestros = !catalogoItemId && item.agregarACatalogo;

          if (forzarMaestros) {
            const { data: nuevoCatalogoItem, error: errCatItem } = await supabase
              .from("catalogo_items")
              .insert({
                nombre_item: item.nombre.trim(),
                unidad: item.unidad || "unidad",
                categoria: etapa.nombre.trim() || "Otro",
                costo_mano_obra_referencial: item.costoManoObraUnitario,
              })
              .select("id")
              .single();
            if (errCatItem) throw errCatItem;
            catalogoItemId = nuevoCatalogoItem.id;
          }

          const { data: itemRow, error: errItem } = await supabase
            .from("cotizacion_items_apu")
            .insert({
              etapa_id: etapaRow.id,
              catalogo_item_id: catalogoItemId,
              descripcion_item: item.nombre,
              cantidad: item.cantidad,
              unidad: item.unidad,
              costo_material_unitario: totalMaterialUnitario,
              costo_mano_obra_unitario: item.costoManoObraUnitario,
              costo_equipo_unitario: totalEquipoUnitario,
              mostrar_precio_individual: item.mostrarPrecioIndividual,
            })
            .select("id")
            .single();
          if (errItem) throw errItem;

          // Guardar materiales de esta línea: a Maestros si corresponde
          // (vinculado o casilla marcada), si no, quedan solo en esta cotización.
          for (const linea of item.materiales) {
            if (!linea.nombre.trim()) continue;
            let materialId = linea.materialId;
            const debeCrearMaestro =
              !materialId && (forzarMaestros || linea.agregarAMaestros);

            if (debeCrearMaestro) {
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

            if (materialId) {
              await supabase.from("cotizacion_item_materiales").insert({
                cotizacion_item_id: itemRow.id,
                material_id: materialId,
                cantidad_total: linea.cantidadPorUnidad * item.cantidad,
                costo_unitario: linea.costoUnitario,
              });
            } else {
              await supabase.from("cotizacion_item_materiales").insert({
                cotizacion_item_id: itemRow.id,
                material_id: null,
                nombre_libre: linea.nombre.trim(),
                unidad_libre: linea.unidad || "un",
                cantidad_total: linea.cantidadPorUnidad * item.cantidad,
                costo_unitario: linea.costoUnitario,
              });
            }

            // Si el ítem se agrega al Catálogo, el material también debe
            // quedar vinculado como plantilla del ítem.
            if (forzarMaestros && catalogoItemId) {
              await supabase.from("catalogo_item_materiales").insert({
                catalogo_item_id: catalogoItemId,
                material_id: materialId,
                cantidad_por_unidad: linea.cantidadPorUnidad,
              });
            }
          }

          // Guardar equipos de esta línea, mismo criterio que materiales
          for (const linea of item.equipos) {
            if (!linea.nombre.trim()) continue;
            let equipoId = linea.equipoId;
            const debeCrearMaestro =
              !equipoId && (forzarMaestros || linea.agregarAMaestros);

            if (debeCrearMaestro) {
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

            if (equipoId) {
              await supabase.from("cotizacion_item_equipos").insert({
                cotizacion_item_id: itemRow.id,
                equipo_id: equipoId,
                cantidad_total: linea.cantidadPorUnidad * item.cantidad,
                costo_unitario: linea.costoUnitario,
              });
            } else {
              await supabase.from("cotizacion_item_equipos").insert({
                cotizacion_item_id: itemRow.id,
                equipo_id: null,
                nombre_libre: linea.nombre.trim(),
                unidad_libre: linea.unidad || "un",
                cantidad_total: linea.cantidadPorUnidad * item.cantidad,
                costo_unitario: linea.costoUnitario,
              });
            }

            if (forzarMaestros && catalogoItemId) {
              await supabase.from("catalogo_item_equipos").insert({
                catalogo_item_id: catalogoItemId,
                equipo_id: equipoId,
                cantidad_por_unidad: linea.cantidadPorUnidad,
              });
            }
          }
        }
      }

      router.push(`/cotizacion/${cotizacionIdFinal}`);
      router.refresh();
    } catch {
      setError("No se pudo guardar la cotización. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  if (cargandoDatos) {
    return (
      <div className="min-h-dvh bg-bg md:flex">
        <Sidebar />
        <main className="flex-1 md:pl-64 flex items-center justify-center">
          <p className="text-text-dim text-sm">Cargando cotización...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-32">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link
            href={esEdicion ? `/cotizacion/${cotizacionId}` : "/cotizacion"}
            className="p-1 -ml-1 text-text-dim"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="font-display text-lg">
              {esEdicion ? "Editar cotización" : "Nueva cotización"}
            </h1>
            {esEdicion && estadoActual === "APROBADA" && (
              <p className="text-warn text-xs">
                Cotización aprobada — vinculada a una obra en ejecución
              </p>
            )}
          </div>
        </header>

        <div
          className={`px-5 md:px-8 py-6 max-w-6xl md:flex md:gap-8 md:items-start ${
            edicionBloqueada ? "opacity-40 pointer-events-none select-none" : ""
          }`}
        >
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
                        placeholder="Nombre de la etapa (opcional — solo si divides la obra en fases)"
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
              <label className="flex items-center gap-2.5 cursor-pointer mb-4 pb-4 border-b border-border">
                <input
                  type="checkbox"
                  checked={conIva}
                  onChange={(e) => setConIva(e.target.checked)}
                  className="h-5 w-5 accent-accent"
                />
                <span className="text-sm font-medium">
                  {conIva
                    ? "Cotización CON IVA (19%)"
                    : "Cotización SIN IVA — el cliente lo prefiere así"}
                </span>
              </label>

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
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-text-dim">Equipos</span>
                  <span>${totalEquipos.toLocaleString("es-CL")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-1.5 border-t border-border pt-3 mt-1">
                <span className="text-text-dim">Subtotal (neto)</span>
                <span>${totalGeneral.toLocaleString("es-CL")}</span>
              </div>
              {conIva ? (
                <>
                  <div className="flex justify-between text-sm py-1.5">
                    <span className="text-text-dim">IVA (19%)</span>
                    <span>${(totalGeneral * 0.19).toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between font-display text-lg border-t border-border pt-3 mt-1">
                    <span>Total con IVA</span>
                    <span>${(totalGeneral * 1.19).toLocaleString("es-CL")}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between font-display text-lg border-t border-border pt-3 mt-1">
                  <span>Total (sin IVA)</span>
                  <span>${totalGeneral.toLocaleString("es-CL")}</span>
                </div>
              )}
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

      {!edicionBloqueada && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-bg/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 safe-bottom">
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full max-w-3xl rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base active:scale-[0.98] transition disabled:opacity-60"
          >
            {guardando
              ? "Guardando..."
              : esEdicion
              ? "Guardar cambios"
              : "Guardar cotización en borrador"}
          </button>
        </div>
      )}

      {mostrarAdvertencia && (
        <ModalAdvertencia
          titulo="Esta cotización ya está aprobada"
          mensaje='Esta cotización ya está aprobada y vinculada a una obra en ejecución. ¿Desea continuar con la edición? Los cambios se reflejarán en la obra.'
          textoConfirmar="Sí, continuar editando"
          textoCancelar="Cancelar"
          onConfirmar={() => {
            setMostrarAdvertencia(false);
            setEdicionBloqueada(false);
          }}
          onCancelar={() => router.push(`/cotizacion/${cotizacionId}`)}
        />
      )}
    </div>
  );
}
