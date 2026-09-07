"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Plus, Trash2 } from "lucide-react";

type Equipo = {
  id: string;
  nombre: string;
  modelo: string | null;
  marca: string | null;
  unidad: string;
  precio_unitario: number;
};

export default function EquiposPage() {
  const supabase = createClient();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [unidad, setUnidad] = useState("un");
  const [precio, setPrecio] = useState(0);

  async function cargar() {
    const { data } = await supabase
      .from("equipos_maestros")
      .select("*")
      .order("nombre");
    setEquipos(data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function agregar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    await supabase.from("equipos_maestros").insert({
      nombre: nombre.trim(),
      modelo: modelo.trim() || null,
      marca: marca.trim() || null,
      unidad: unidad.trim() || "un",
      precio_unitario: precio,
    });
    setNombre("");
    setModelo("");
    setMarca("");
    setUnidad("un");
    setPrecio(0);
    setGuardando(false);
    cargar();
  }

  const [eliminando, setEliminando] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function eliminar(id: string, nombreEquipo: string) {
    const confirmado = window.confirm(
      `¿Eliminar "${nombreEquipo}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setEliminando(id);
    setErrorEliminar(null);
    const { error } = await supabase.from("equipos_maestros").delete().eq("id", id);

    if (error) {
      // Código 23503 = violación de llave foránea: el equipo está en uso
      // en algún catálogo o cotización, la base de datos lo protege.
      if (error.code === "23503") {
        setErrorEliminar(
          `No se pudo eliminar "${nombreEquipo}" — está siendo usado en al menos un ítem de catálogo o una cotización existente.`
        );
      } else {
        setErrorEliminar(`No se pudo eliminar "${nombreEquipo}". Intenta de nuevo.`);
      }
    } else {
      cargar();
    }
    setEliminando(null);
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl pb-24">
        <h1 className="font-display text-2xl mb-1">Equipos</h1>
        <p className="text-text-dim text-sm mb-6">
          {equipos.length} equipos en el catálogo
        </p>

        {errorEliminar && (
          <div className="flex items-start justify-between gap-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3 mb-4">
            <p>{errorEliminar}</p>
            <button onClick={() => setErrorEliminar(null)} className="shrink-0 font-medium">
              Cerrar
            </button>
          </div>
        )}

        {/* Formulario de agregar */}
        <div className="border border-dashed border-border rounded-xl p-4 mb-6 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre (ej: Cámara de seguridad)"
              className="rounded-lg bg-surface border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Marca"
              className="rounded-lg bg-surface border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Modelo"
              className="rounded-lg bg-surface border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              placeholder="Unidad (un, m, etc.)"
              className="rounded-lg bg-surface border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(Number(e.target.value))}
              placeholder="Precio unitario"
              className="rounded-lg bg-surface border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            onClick={agregar}
            disabled={guardando || !nombre.trim()}
            className="flex items-center gap-1.5 bg-accent text-accent-text rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            <Plus size={16} /> {guardando ? "Agregando..." : "Agregar equipo"}
          </button>
        </div>

        {/* Lista */}
        <div className="border border-border rounded-xl overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wide">
                <th className="text-left font-medium px-4 py-3">Nombre</th>
                <th className="text-left font-medium px-4 py-3">Marca</th>
                <th className="text-left font-medium px-4 py-3">Modelo</th>
                <th className="text-left font-medium px-4 py-3">Unidad</th>
                <th className="text-right font-medium px-4 py-3">Precio</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((eq) => (
                <tr
                  key={eq.id}
                  className="border-b border-border last:border-0 hover:bg-surface-raised transition"
                >
                  <td className="px-4 py-3 font-medium">{eq.nombre}</td>
                  <td className="px-4 py-3 text-text-dim">{eq.marca ?? "—"}</td>
                  <td className="px-4 py-3 text-text-dim">{eq.modelo ?? "—"}</td>
                  <td className="px-4 py-3 text-text-dim">{eq.unidad}</td>
                  <td className="px-4 py-3 text-right">
                    ${Number(eq.precio_unitario).toLocaleString("es-CL")}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => eliminar(eq.id, eq.nombre)}
                      disabled={eliminando === eq.id}
                      className="text-text-dim disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && equipos.length === 0 && (
            <p className="text-text-dim text-sm text-center py-10">
              Aún no tienes equipos cargados. Agrega el primero arriba.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
