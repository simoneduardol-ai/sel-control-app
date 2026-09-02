"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Plus, ImageDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { generarImagenLista, descargarImagen } from "@/lib/imagenLista";

type MaterialAgrupado = {
  material_id: string;
  cantidad_total: number;
  costo_ref: number;
  nombre?: string;
  unidad?: string;
};

type EquipoAgrupado = {
  equipo_id: string;
  cantidad_total: number;
  costo_ref: number;
  nombre?: string;
  unidad?: string;
};

type ProveedorCodigo = { codigo: string; nombre: string };

type FilaPrecio = { precio: number; codigo: string };

export default function ProveedoresPage() {
  const params = useParams();
  const cotizacionId = params.id as string;
  const supabase = createClient();

  const [materiales, setMateriales] = useState<MaterialAgrupado[]>([]);
  const [equipos, setEquipos] = useState<EquipoAgrupado[]>([]);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [copiadoEquipos, setCopiadoEquipos] = useState(false);

  const [codigos, setCodigos] = useState<ProveedorCodigo[]>([]);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [nuevoNombreProveedor, setNuevoNombreProveedor] = useState("");
  const [creandoCodigo, setCreandoCodigo] = useState(false);

  const [preciosMateriales, setPreciosMateriales] = useState<Record<string, FilaPrecio>>({});
  const [preciosEquipos, setPreciosEquipos] = useState<Record<string, FilaPrecio>>({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const cargarLista = useCallback(async () => {
    const { data: lista } = await supabase
      .from("listas_materiales")
      .select("json_materiales_agrupados")
      .eq("cotizacion_id", cotizacionId)
      .single();
    if (!lista) return;
    setMateriales((lista.json_materiales_agrupados ?? []) as MaterialAgrupado[]);
  }, [cotizacionId]);

  const cargarListaEquipos = useCallback(async () => {
    const { data: lista } = await supabase
      .from("listas_equipos")
      .select("json_equipos_agrupados")
      .eq("cotizacion_id", cotizacionId)
      .single();
    if (!lista) return;
    setEquipos((lista.json_equipos_agrupados ?? []) as EquipoAgrupado[]);
  }, [cotizacionId]);

  const cargarCodigos = useCallback(async () => {
    const { data } = await supabase
      .from("proveedores")
      .select("codigo, nombre")
      .not("codigo", "is", null)
      .order("codigo");
    setCodigos((data ?? []) as ProveedorCodigo[]);
  }, []);

  // Trae el precio/código ya guardado por material, para precargar el formulario
  const cargarPreciosActuales = useCallback(async () => {
    const { data: mats } = await supabase
      .from("cotizacion_item_materiales")
      .select("material_id, costo_unitario, proveedor_codigo, cotizacion_items_apu!inner(etapa_id, cotizacion_etapas!inner(cotizacion_id))")
      .eq("cotizacion_items_apu.cotizacion_etapas.cotizacion_id", cotizacionId);

    const mapaMat: Record<string, FilaPrecio> = {};
    (mats ?? []).forEach((m: { material_id: string | null; costo_unitario: number; proveedor_codigo: string | null }) => {
      if (!m.material_id) return;
      mapaMat[m.material_id] = { precio: Number(m.costo_unitario), codigo: m.proveedor_codigo ?? "" };
    });
    setPreciosMateriales(mapaMat);

    const { data: eqs } = await supabase
      .from("cotizacion_item_equipos")
      .select("equipo_id, costo_unitario, proveedor_codigo, cotizacion_items_apu!inner(etapa_id, cotizacion_etapas!inner(cotizacion_id))")
      .eq("cotizacion_items_apu.cotizacion_etapas.cotizacion_id", cotizacionId);

    const mapaEq: Record<string, FilaPrecio> = {};
    (eqs ?? []).forEach((e: { equipo_id: string | null; costo_unitario: number; proveedor_codigo: string | null }) => {
      if (!e.equipo_id) return;
      mapaEq[e.equipo_id] = { precio: Number(e.costo_unitario), codigo: e.proveedor_codigo ?? "" };
    });
    setPreciosEquipos(mapaEq);
  }, [cotizacionId]);

  useEffect(() => {
    cargarLista();
    cargarListaEquipos();
    cargarCodigos();
    cargarPreciosActuales();
  }, [cargarLista, cargarListaEquipos, cargarCodigos, cargarPreciosActuales]);

  async function generarLista() {
    setGenerando(true);
    await supabase.rpc("generar_lista_materiales", { p_cotizacion_id: cotizacionId });
    await supabase.rpc("generar_lista_equipos", { p_cotizacion_id: cotizacionId });
    await cargarLista();
    await cargarListaEquipos();
    setGenerando(false);
  }

  function copiarLista() {
    const texto = materiales.map((m) => `${m.nombre} — ${m.cantidad_total} ${m.unidad}`).join("\n");
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function copiarListaEquipos() {
    const texto = equipos.map((e) => `${e.nombre} — ${e.cantidad_total} ${e.unidad}`).join("\n");
    navigator.clipboard.writeText(texto);
    setCopiadoEquipos(true);
    setTimeout(() => setCopiadoEquipos(false), 2000);
  }

  function descargarImagenMateriales() {
    const dataUrl = generarImagenLista({
      titulo: "Lista de materiales",
      subtitulo: "Para cotizar — favor responder con precios",
      filas: materiales.map((m) => ({ nombre: m.nombre ?? "Material", cantidad: m.cantidad_total, unidad: m.unidad ?? "un" })),
    });
    descargarImagen(dataUrl, "lista-materiales.png");
  }

  function descargarImagenEquipos() {
    const dataUrl = generarImagenLista({
      titulo: "Lista de equipos",
      subtitulo: "Para cotizar — favor responder con precios",
      filas: equipos.map((e) => ({ nombre: e.nombre ?? "Equipo", cantidad: e.cantidad_total, unidad: e.unidad ?? "un" })),
    });
    descargarImagen(dataUrl, "lista-equipos.png");
  }

  async function crearCodigo() {
    if (!nuevoCodigo.trim() || !nuevoNombreProveedor.trim()) return;
    setCreandoCodigo(true);
    await supabase.from("proveedores").insert({
      codigo: nuevoCodigo.trim().toUpperCase(),
      nombre: nuevoNombreProveedor.trim(),
    });
    setNuevoCodigo("");
    setNuevoNombreProveedor("");
    setCreandoCodigo(false);
    cargarCodigos();
  }

  async function guardarPreciosDefinitivos() {
    setGuardando(true);

    const { data: itemsData } = await supabase
      .from("cotizacion_items_apu")
      .select("id, etapa_id, cotizacion_etapas!inner(cotizacion_id)")
      .eq("cotizacion_etapas.cotizacion_id", cotizacionId);
    const itemIds = (itemsData ?? []).map((r: { id: string }) => r.id);

    for (const materialId of Object.keys(preciosMateriales)) {
      const fila = preciosMateriales[materialId];
      if (!fila.precio) continue;
      await supabase
        .from("cotizacion_item_materiales")
        .update({ costo_unitario: fila.precio, proveedor_codigo: fila.codigo || null })
        .eq("material_id", materialId)
        .in("cotizacion_item_id", itemIds);
    }

    for (const equipoId of Object.keys(preciosEquipos)) {
      const fila = preciosEquipos[equipoId];
      if (!fila.precio) continue;
      await supabase
        .from("cotizacion_item_equipos")
        .update({ costo_unitario: fila.precio, proveedor_codigo: fila.codigo || null })
        .eq("equipo_id", equipoId)
        .in("cotizacion_item_id", itemIds);
    }

    await supabase.rpc("recalcular_totales_cotizacion", { p_cotizacion_id: cotizacionId });

    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link href={`/cotizacion/${cotizacionId}`} className="p-1 -ml-1 text-text-dim">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-display text-lg">Proveedores</h1>
        </header>

        <div className="px-5 md:px-8 py-6 max-w-2xl space-y-6">
          {/* Lista de materiales */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim">Lista de materiales</h2>
              <button onClick={generarLista} disabled={generando} className="text-accent text-sm font-medium">
                {generando ? "Generando..." : "Generar / actualizar"}
              </button>
            </div>
            {materiales.length === 0 ? (
              <p className="text-text-dim text-sm bg-surface border border-border rounded-xl p-4">
                Sin lista generada todavía. Haz clic en &quot;Generar / actualizar&quot;.
              </p>
            ) : (
              <>
                <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
                  {materiales.map((m) => (
                    <div key={m.material_id} className="flex justify-between px-4 py-2.5 text-sm">
                      <span>{m.nombre}</span>
                      <span className="text-text-dim">{m.cantidad_total} {m.unidad}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-2">
                  <button onClick={copiarLista} className="flex items-center gap-1.5 text-accent text-sm font-medium">
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                    {copiado ? "Copiado" : "Copiar como texto"}
                  </button>
                  <button onClick={descargarImagenMateriales} className="flex items-center gap-1.5 text-accent text-sm font-medium">
                    <ImageDown size={16} /> Descargar imagen (WhatsApp)
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Lista de equipos */}
          {equipos.length > 0 && (
            <section>
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2">Lista de equipos</h2>
              <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
                {equipos.map((e) => (
                  <div key={e.equipo_id} className="flex justify-between px-4 py-2.5 text-sm">
                    <span>{e.nombre}</span>
                    <span className="text-text-dim">{e.cantidad_total} {e.unidad}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2">
                <button onClick={copiarListaEquipos} className="flex items-center gap-1.5 text-accent text-sm font-medium">
                  {copiadoEquipos ? <Check size={16} /> : <Copy size={16} />}
                  {copiadoEquipos ? "Copiado" : "Copiar como texto"}
                </button>
                <button onClick={descargarImagenEquipos} className="flex items-center gap-1.5 text-accent text-sm font-medium">
                  <ImageDown size={16} /> Descargar imagen (WhatsApp)
                </button>
              </div>
            </section>
          )}

          {/* Códigos de proveedor */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2">Códigos de proveedor</h2>
            <p className="text-text-dim text-xs mb-2">
              Úsalos junto al precio de cada material/equipo. &quot;SL&quot; = lo pones tú
              mismo, sin proveedor externo.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {codigos.map((c) => (
                <span key={c.codigo} className="text-xs bg-surface border border-border rounded-full px-2.5 py-1">
                  <strong>{c.codigo}</strong> — {c.nombre}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={nuevoCodigo}
                onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())}
                placeholder="Código (ej: RH)"
                maxLength={6}
                className="w-28 rounded-lg bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={nuevoNombreProveedor}
                onChange={(e) => setNuevoNombreProveedor(e.target.value)}
                placeholder="Nombre del proveedor"
                className="flex-1 rounded-lg bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={crearCodigo}
                disabled={creandoCodigo || !nuevoCodigo.trim() || !nuevoNombreProveedor.trim()}
                className="rounded-lg bg-accent text-accent-text px-3 py-2 disabled:opacity-60"
              >
                <Plus size={16} />
              </button>
            </div>
          </section>

          {/* Precios definitivos: materiales */}
          {materiales.length > 0 && (
            <section>
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2">
                Precios definitivos — Materiales
              </h2>
              <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
                {materiales.map((m) => {
                  const fila = preciosMateriales[m.material_id] ?? { precio: 0, codigo: "" };
                  return (
                    <div key={m.material_id} className="flex items-center gap-2 px-4 py-2.5">
                      <span className="text-sm flex-1 truncate">{m.nombre}</span>
                      <input
                        type="number"
                        value={fila.precio || ""}
                        placeholder="Precio"
                        onChange={(e) =>
                          setPreciosMateriales((prev) => ({
                            ...prev,
                            [m.material_id]: { ...fila, precio: Number(e.target.value) },
                          }))
                        }
                        className="w-24 rounded-lg bg-bg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <select
                        value={fila.codigo}
                        onChange={(e) =>
                          setPreciosMateriales((prev) => ({
                            ...prev,
                            [m.material_id]: { ...fila, codigo: e.target.value },
                          }))
                        }
                        className="w-24 rounded-lg bg-bg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">Prov.</option>
                        {codigos.map((c) => (
                          <option key={c.codigo} value={c.codigo}>
                            {c.codigo}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Precios definitivos: equipos */}
          {equipos.length > 0 && (
            <section>
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2">
                Precios definitivos — Equipos
              </h2>
              <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
                {equipos.map((eq) => {
                  const fila = preciosEquipos[eq.equipo_id] ?? { precio: 0, codigo: "" };
                  return (
                    <div key={eq.equipo_id} className="flex items-center gap-2 px-4 py-2.5">
                      <span className="text-sm flex-1 truncate">{eq.nombre}</span>
                      <input
                        type="number"
                        value={fila.precio || ""}
                        placeholder="Precio"
                        onChange={(e) =>
                          setPreciosEquipos((prev) => ({
                            ...prev,
                            [eq.equipo_id]: { ...fila, precio: Number(e.target.value) },
                          }))
                        }
                        className="w-24 rounded-lg bg-bg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <select
                        value={fila.codigo}
                        onChange={(e) =>
                          setPreciosEquipos((prev) => ({
                            ...prev,
                            [eq.equipo_id]: { ...fila, codigo: e.target.value },
                          }))
                        }
                        className="w-24 rounded-lg bg-bg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">Prov.</option>
                        {codigos.map((c) => (
                          <option key={c.codigo} value={c.codigo}>
                            {c.codigo}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(materiales.length > 0 || equipos.length > 0) && (
            <button
              onClick={guardarPreciosDefinitivos}
              disabled={guardando}
              className="w-full rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base disabled:opacity-60"
            >
              {guardando ? "Guardando..." : guardado ? "✓ Precios guardados" : "Guardar precios definitivos"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
