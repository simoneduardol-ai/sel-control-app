"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MaterialesEditor, { type MaterialLinea } from "@/components/MaterialesEditor";
import EquiposItemEditor, { type EquipoLinea } from "@/components/EquiposItemEditor";

const ETAPAS = [
  "Empalme",
  "Instalaciones eléctricas",
  "Canalización",
  "Cableado",
  "Tablero",
  "Trámites",
  "Otro",
];

export default function EditarItemCatalogoPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const esNuevo = params.id === "nuevo";

  const [cargando, setCargando] = useState(!esNuevo);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("unidad");
  const [etapa, setEtapa] = useState("Empalme");
  const [manoObra, setManoObra] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [materiales, setMateriales] = useState<MaterialLinea[]>([]);
  const [equipos, setEquipos] = useState<EquipoLinea[]>([]);

  useEffect(() => {
    if (esNuevo) return;
    (async () => {
      const { data: item } = await supabase
        .from("catalogo_items")
        .select("*")
        .eq("id", params.id)
        .single();

      if (item) {
        setNombre(item.nombre_item);
        setUnidad(item.unidad);
        setEtapa(item.categoria);
        setManoObra(Number(item.costo_mano_obra_referencial));
        setObservaciones(item.observaciones ?? "");
      }

      const { data: vinculos } = await supabase
        .from("catalogo_item_materiales")
        .select("id, cantidad_por_unidad, materiales_maestros(id, nombre, unidad, costo_referencial)")
        .eq("catalogo_item_id", params.id);

      if (vinculos) {
        setMateriales(
          vinculos.map((v) => {
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
          })
        );
      }

      const { data: vinculosEquipos } = await supabase
        .from("catalogo_item_equipos")
        .select("id, cantidad_por_unidad, equipos_maestros(id, nombre, marca, unidad, precio_unitario)")
        .eq("catalogo_item_id", params.id);

      if (vinculosEquipos) {
        setEquipos(
          vinculosEquipos.map((v) => {
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
          })
        );
      }

      setCargando(false);
    })();
  }, [esNuevo, params.id]);

  const totalMateriales = materiales.reduce(
    (sum, l) => sum + l.costoUnitario * l.cantidadPorUnidad,
    0
  );
  const totalEquipos = equipos.reduce(
    (sum, l) => sum + l.costoUnitario * l.cantidadPorUnidad,
    0
  );
  const totalVenta = manoObra + totalMateriales + totalEquipos;

  async function guardar() {
    if (!nombre.trim()) return;
    setGuardando(true);

    try {
      let itemId = esNuevo ? null : (params.id as string);

      if (esNuevo) {
        const { data, error } = await supabase
          .from("catalogo_items")
          .insert({
            nombre_item: nombre.trim(),
            unidad,
            categoria: etapa,
            costo_mano_obra_referencial: manoObra,
            observaciones: observaciones || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        itemId = data.id;
      } else {
        const { error } = await supabase
          .from("catalogo_items")
          .update({
            nombre_item: nombre.trim(),
            unidad,
            categoria: etapa,
            costo_mano_obra_referencial: manoObra,
            observaciones: observaciones || null,
          })
          .eq("id", itemId);
        if (error) throw error;

        // Limpiar vínculos viejos, se recrean abajo
        await supabase
          .from("catalogo_item_materiales")
          .delete()
          .eq("catalogo_item_id", itemId);
        await supabase
          .from("catalogo_item_equipos")
          .delete()
          .eq("catalogo_item_id", itemId);
      }

      // Resolver cada línea de material: crear si es nuevo, vincular si ya existe
      for (const linea of materiales) {
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

        const { error: errVinculo } = await supabase
          .from("catalogo_item_materiales")
          .insert({
            catalogo_item_id: itemId,
            material_id: materialId,
            cantidad_por_unidad: linea.cantidadPorUnidad,
          });
        if (errVinculo) throw errVinculo;
      }

      // Vincular equipos (creando nuevos si hace falta, igual que materiales)
      for (const linea of equipos) {
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

        const { error: errEquipo } = await supabase
          .from("catalogo_item_equipos")
          .insert({
            catalogo_item_id: itemId,
            equipo_id: equipoId,
            cantidad_por_unidad: linea.cantidadPorUnidad,
          });
        if (errEquipo) throw errEquipo;
      }

      router.push("/catalogo");
      router.refresh();
    } catch {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (esNuevo) return;
    setEliminando(true);
    await supabase.from("catalogo_items").delete().eq("id", params.id);
    router.push("/catalogo");
    router.refresh();
  }

  if (cargando) {
    return (
      <div className="min-h-dvh bg-bg md:flex">
        <Sidebar />
        <main className="flex-1 md:pl-64 flex items-center justify-center">
          <p className="text-text-dim text-sm">Cargando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-24">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link href="/catalogo" className="p-1 -ml-1 text-text-dim">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-display text-lg">
            {esNuevo ? "Nuevo ítem" : nombre || "Ítem"}
          </h1>
        </header>

        <div className="px-5 md:px-8 py-6 max-w-4xl grid md:grid-cols-2 gap-6">
          {/* Columna izquierda: datos base */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                Nombre del ítem
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                  Unidad
                </label>
                <input
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                  Etapa
                </label>
                <select
                  value={etapa}
                  onChange={(e) => setEtapa(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {ETAPAS.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                Mano de obra (por unidad)
              </label>
              <input
                type="number"
                value={manoObra}
                onChange={(e) => setManoObra(Number(e.target.value))}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-text-dim text-xs mt-1.5">
                Mano de obra = lo que cobras por tu trabajo de instalar UNA unidad de
                este ítem, sin contar los materiales. Los materiales se agregan como
                lista aparte, a la derecha.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-dim uppercase tracking-wide mb-1.5">
                Observaciones (uso interno, opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Notas internas sobre este ítem..."
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            {!esNuevo && (
              <button
                onClick={eliminar}
                disabled={eliminando}
                className="flex items-center gap-1.5 text-danger text-sm font-medium"
              >
                <Trash2 size={16} />
                {eliminando ? "Eliminando..." : "Eliminar ítem"}
              </button>
            )}
          </div>

          {/* Columna derecha: materiales + equipos + resumen */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2">
                Materiales e insumos
              </h2>
              <MaterialesEditor lineas={materiales} onChange={setMateriales} />
            </div>

            <div>
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2">
                Equipos (cuando aplique)
              </h2>
              <EquiposItemEditor lineas={equipos} onChange={setEquipos} />
            </div>

            <div className="border border-border rounded-xl bg-surface p-4">
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
                Precio unitario de venta
              </h2>
              <div className="flex justify-between text-sm py-1.5">
                <span className="text-text-dim">Mano de obra</span>
                <span>${manoObra.toLocaleString("es-CL")}</span>
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
              <div className="flex justify-between font-display text-lg border-t border-border pt-3 mt-2">
                <span>Precio unitario de venta</span>
                <span>${totalVenta.toLocaleString("es-CL")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-bg/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 safe-bottom">
        <button
          onClick={guardar}
          disabled={guardando || !nombre.trim()}
          className="w-full max-w-4xl rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base active:scale-[0.98] transition disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar ítem"}
        </button>
      </div>
    </div>
  );
}
