"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";

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

type Proveedor = { id: string; nombre: string; email: string | null; whatsapp: string | null };
type Solicitud = { id: string; proveedor_id: string; estado: string };

export default function ProveedoresPage() {
  const params = useParams();
  const cotizacionId = params.id as string;
  const supabase = createClient();

  const [materiales, setMateriales] = useState<MaterialAgrupado[]>([]);
  const [listaId, setListaId] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [equipos, setEquipos] = useState<EquipoAgrupado[]>([]);
  const [copiadoEquipos, setCopiadoEquipos] = useState(false);

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: "", email: "", whatsapp: "" });
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  const [respuestas, setRespuestas] = useState<
    Record<string, Record<string, { precio: number; disponible: boolean }>>
  >({}); // solicitudId -> materialId -> {precio, disponible}
  const [guardandoRespuesta, setGuardandoRespuesta] = useState<string | null>(null);
  const [aplicando, setAplicando] = useState(false);

  const cargarLista = useCallback(async () => {
    const { data: lista } = await supabase
      .from("listas_materiales")
      .select("id, json_materiales_agrupados")
      .eq("cotizacion_id", cotizacionId)
      .single();

    if (!lista) return;
    setListaId(lista.id);

    const agrupados = (lista.json_materiales_agrupados ?? []) as MaterialAgrupado[];
    if (agrupados.length === 0) {
      setMateriales([]);
      return;
    }

    const ids = agrupados.map((m) => m.material_id);
    const { data: maestros } = await supabase
      .from("materiales_maestros")
      .select("id, nombre, unidad")
      .in("id", ids);

    const conNombre = agrupados.map((m) => {
      const info = maestros?.find((x) => x.id === m.material_id);
      return { ...m, nombre: info?.nombre ?? "Material", unidad: info?.unidad ?? "un" };
    });
    setMateriales(conNombre);
  }, [cotizacionId]);

  const cargarListaEquipos = useCallback(async () => {
    const { data: lista } = await supabase
      .from("listas_equipos")
      .select("json_equipos_agrupados")
      .eq("cotizacion_id", cotizacionId)
      .single();

    if (!lista) return;
    const agrupados = (lista.json_equipos_agrupados ?? []) as EquipoAgrupado[];
    if (agrupados.length === 0) {
      setEquipos([]);
      return;
    }

    const ids = agrupados.map((e) => e.equipo_id);
    const { data: maestros } = await supabase
      .from("equipos_maestros")
      .select("id, nombre, unidad")
      .in("id", ids);

    const conNombre = agrupados.map((e) => {
      const info = maestros?.find((x) => x.id === e.equipo_id);
      return { ...e, nombre: info?.nombre ?? "Equipo", unidad: info?.unidad ?? "un" };
    });
    setEquipos(conNombre);
  }, [cotizacionId]);

  const cargarProveedores = useCallback(async () => {
    const { data } = await supabase.from("proveedores").select("*").order("nombre");
    setProveedores(data ?? []);
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    if (!listaId) return;
    const { data } = await supabase
      .from("solicitudes_proveedor")
      .select("id, proveedor_id, estado")
      .eq("lista_id", listaId);
    setSolicitudes(data ?? []);
  }, [listaId]);

  useEffect(() => {
    cargarLista();
    cargarListaEquipos();
    cargarProveedores();
  }, [cargarLista, cargarListaEquipos, cargarProveedores]);

  useEffect(() => {
    cargarSolicitudes();
  }, [listaId, cargarSolicitudes]);

  async function generarLista() {
    setGenerando(true);
    await supabase.rpc("generar_lista_materiales", { p_cotizacion_id: cotizacionId });
    await supabase.rpc("generar_lista_equipos", { p_cotizacion_id: cotizacionId });
    await cargarLista();
    await cargarListaEquipos();
    setGenerando(false);
  }

  function copiarListaEquipos() {
    const texto = equipos
      .map((e) => `${e.nombre} — ${e.cantidad_total} ${e.unidad}`)
      .join("\n");
    navigator.clipboard.writeText(texto);
    setCopiadoEquipos(true);
    setTimeout(() => setCopiadoEquipos(false), 2000);
  }

  function copiarLista() {
    const texto = materiales
      .map((m) => `${m.nombre} — ${m.cantidad_total} ${m.unidad}`)
      .join("\n");
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function crearProveedor() {
    if (!nuevoProveedor.nombre.trim()) return;
    setCreandoProveedor(true);
    await supabase.from("proveedores").insert({
      nombre: nuevoProveedor.nombre.trim(),
      email: nuevoProveedor.email || null,
      whatsapp: nuevoProveedor.whatsapp || null,
    });
    setNuevoProveedor({ nombre: "", email: "", whatsapp: "" });
    setCreandoProveedor(false);
    cargarProveedores();
  }

  async function enviarSolicitud(proveedorId: string) {
    if (!listaId) return;
    await supabase.from("solicitudes_proveedor").insert({
      lista_id: listaId,
      proveedor_id: proveedorId,
      estado: "enviada",
    });
    await supabase.from("cotizaciones").update({ estado: "EN_PROVEEDORES" }).eq("id", cotizacionId);
    cargarSolicitudes();
  }

  function actualizarRespuesta(
    solicitudId: string,
    materialId: string,
    patch: Partial<{ precio: number; disponible: boolean }>
  ) {
    setRespuestas((prev) => ({
      ...prev,
      [solicitudId]: {
        ...prev[solicitudId],
        [materialId]: {
          precio: prev[solicitudId]?.[materialId]?.precio ?? 0,
          disponible: prev[solicitudId]?.[materialId]?.disponible ?? true,
          ...patch,
        },
      },
    }));
  }

  async function guardarRespuesta(solicitudId: string) {
    setGuardandoRespuesta(solicitudId);
    const datos = respuestas[solicitudId] ?? {};
    for (const materialId of Object.keys(datos)) {
      const r = datos[materialId];
      if (!r.precio) continue;
      await supabase.from("cotizaciones_proveedor_respuesta").insert({
        solicitud_id: solicitudId,
        material_id: materialId,
        precio_actualizado: r.precio,
        disponible: r.disponible,
      });
    }
    await supabase
      .from("solicitudes_proveedor")
      .update({ estado: "respondida" })
      .eq("id", solicitudId);
    setGuardandoRespuesta(null);
    cargarSolicitudes();
  }

  async function aplicarPrecios() {
    setAplicando(true);
    await supabase.rpc("actualizar_cotizacion_con_precios_reales", {
      p_cotizacion_id: cotizacionId,
    });
    setAplicando(false);
    window.location.href = `/cotizacion/${cotizacionId}`;
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

        <div className="px-5 md:px-8 py-6 max-w-2xl space-y-8">
          {/* Lista de materiales */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-text-dim">Lista de materiales</h2>
              <button
                onClick={generarLista}
                disabled={generando}
                className="text-accent text-sm font-medium"
              >
                {generando ? "Generando..." : "Generar / actualizar"}
              </button>
            </div>

            {materiales.length === 0 ? (
              <p className="text-text-dim text-sm bg-surface border border-border rounded-xl p-4">
                Sin lista generada todavía. Haz clic en &quot;Generar / actualizar&quot; para
                sumar los materiales de todos los ítems de esta cotización.
              </p>
            ) : (
              <>
                <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
                  {materiales.map((m) => (
                    <div
                      key={m.material_id}
                      className="flex justify-between px-4 py-2.5 text-sm"
                    >
                      <span>{m.nombre}</span>
                      <span className="text-text-dim">
                        {m.cantidad_total} {m.unidad}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={copiarLista}
                  className="mt-2 flex items-center gap-1.5 text-accent text-sm font-medium"
                >
                  {copiado ? <Check size={16} /> : <Copy size={16} />}
                  {copiado ? "Copiado" : "Copiar lista (para WhatsApp/correo)"}
                </button>
              </>
            )}
          </section>

          {/* Lista de equipos (solo si aplica) */}
          {equipos.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2">
                Lista de equipos
              </h2>
              <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
                {equipos.map((e) => (
                  <div
                    key={e.equipo_id}
                    className="flex justify-between px-4 py-2.5 text-sm"
                  >
                    <span>{e.nombre}</span>
                    <span className="text-text-dim">
                      {e.cantidad_total} {e.unidad}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={copiarListaEquipos}
                className="mt-2 flex items-center gap-1.5 text-accent text-sm font-medium"
              >
                {copiadoEquipos ? <Check size={16} /> : <Copy size={16} />}
                {copiadoEquipos ? "Copiado" : "Copiar lista de equipos"}
              </button>
            </section>
          )}

          {/* Proveedores */}
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">Proveedores</h2>
            <div className="space-y-3">
              {proveedores.map((p) => {
                const solicitud = solicitudes.find((s) => s.proveedor_id === p.id);
                return (
                  <div key={p.id} className="border border-border rounded-xl bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.nombre}</p>
                        <p className="text-text-dim text-xs">{p.email || p.whatsapp}</p>
                      </div>
                      {!solicitud ? (
                        <button
                          onClick={() => enviarSolicitud(p.id)}
                          disabled={!listaId}
                          className="text-accent text-sm font-medium disabled:opacity-50"
                        >
                          Marcar como enviada
                        </button>
                      ) : (
                        <span className="text-xs bg-info/15 text-info rounded-full px-2.5 py-1">
                          {solicitud.estado === "respondida" ? "Respondida" : "Enviada"}
                        </span>
                      )}
                    </div>

                    {solicitud && materiales.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {materiales.map((m) => (
                          <div key={m.material_id} className="flex items-center gap-2">
                            <span className="text-xs flex-1 truncate">{m.nombre}</span>
                            <input
                              type="number"
                              placeholder="Precio"
                              onChange={(e) =>
                                actualizarRespuesta(solicitud.id, m.material_id, {
                                  precio: Number(e.target.value),
                                })
                              }
                              className="w-24 rounded-lg bg-bg border border-border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => guardarRespuesta(solicitud.id)}
                          disabled={guardandoRespuesta === solicitud.id}
                          className="text-xs font-medium bg-accent text-accent-text rounded-lg px-3 py-1.5 mt-1"
                        >
                          {guardandoRespuesta === solicitud.id
                            ? "Guardando..."
                            : "Guardar respuesta"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border border-dashed border-border rounded-xl p-4 mt-3 space-y-2">
              <input
                value={nuevoProveedor.nombre}
                onChange={(e) =>
                  setNuevoProveedor((p) => ({ ...p, nombre: e.target.value }))
                }
                placeholder="Nombre del proveedor"
                className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={nuevoProveedor.email}
                  onChange={(e) =>
                    setNuevoProveedor((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="Correo (opcional)"
                  className="rounded-lg bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={nuevoProveedor.whatsapp}
                  onChange={(e) =>
                    setNuevoProveedor((p) => ({ ...p, whatsapp: e.target.value }))
                  }
                  placeholder="WhatsApp (opcional)"
                  className="rounded-lg bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button
                onClick={crearProveedor}
                disabled={creandoProveedor || !nuevoProveedor.nombre.trim()}
                className="flex items-center gap-1.5 text-accent text-sm font-medium"
              >
                <Plus size={16} /> Agregar proveedor
              </button>
            </div>
          </section>

          {solicitudes.some((s) => s.estado === "respondida") && (
            <button
              onClick={aplicarPrecios}
              disabled={aplicando}
              className="w-full rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base disabled:opacity-60"
            >
              {aplicando
                ? "Aplicando..."
                : "Aplicar mejores precios a la cotización"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
