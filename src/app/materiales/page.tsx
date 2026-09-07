"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Plus, X } from "lucide-react";

type Material = {
  id: string;
  nombre: string;
  categoria: string | null;
  unidad: string;
  costo_referencial: number;
};

export default function MaterialesPage() {
  const supabase = createClient();
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidad, setUnidad] = useState("un");
  const [costo, setCosto] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const { data } = await supabase
      .from("materiales_maestros")
      .select("*")
      .order("categoria")
      .order("nombre");
    setMateriales(data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    if (!nombre.trim()) return;
    setGuardando(true);
    await supabase.from("materiales_maestros").insert({
      nombre: nombre.trim(),
      categoria: categoria.trim() || null,
      unidad: unidad.trim() || "un",
      costo_referencial: Number(costo) || 0,
    });
    setGuardando(false);
    setAbierto(false);
    setNombre("");
    setCategoria("");
    setUnidad("un");
    setCosto("");
    cargar();
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl pb-24">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl">Materiales</h1>
          <button
            onClick={() => setAbierto(true)}
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-accent text-accent-text font-medium px-4 py-2 text-sm"
          >
            <Plus size={16} /> Nuevo material
          </button>
        </div>
        <p className="text-text-dim text-sm mb-6">
          {materiales.length} materiales en el catálogo
        </p>

        <div className="border border-border rounded-xl overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wide">
                <th className="text-left font-medium px-4 py-3">Material</th>
                <th className="text-left font-medium px-4 py-3">Categoría</th>
                <th className="text-left font-medium px-4 py-3">Unidad</th>
                <th className="text-right font-medium px-4 py-3">
                  Costo referencial
                </th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-surface-raised transition"
                >
                  <td className="px-4 py-3 font-medium">{m.nombre}</td>
                  <td className="px-4 py-3 text-text-dim">
                    {m.categoria ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-dim">{m.unidad}</td>
                  <td className="px-4 py-3 text-right">
                    ${Number(m.costo_referencial).toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && materiales.length === 0 && (
            <p className="text-text-dim text-sm text-center py-10">
              Aún no tienes materiales cargados en el catálogo.
            </p>
          )}
        </div>
      </main>

      <button
        onClick={() => setAbierto(true)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-accent text-accent-text font-semibold rounded-full pl-5 pr-6 py-4 shadow-lg shadow-black/40 active:scale-[0.97] transition safe-bottom"
      >
        <Plus size={22} strokeWidth={2.5} />
        Nuevo material
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="bg-surface border border-border rounded-t-2xl md:rounded-2xl p-5 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">Nuevo material</h2>
              <button onClick={() => setAbierto(false)} className="text-text-dim">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del material"
                className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Categoría (opcional)"
                className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  placeholder="Unidad (un, m...)"
                  className="rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="number"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  placeholder="Costo referencial"
                  className="rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button
                onClick={crear}
                disabled={guardando || !nombre.trim()}
                className="w-full rounded-xl bg-accent text-accent-text font-semibold py-3 text-sm disabled:opacity-60"
              >
                {guardando ? "Creando..." : "Crear material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
