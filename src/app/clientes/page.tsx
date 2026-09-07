"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Plus, X } from "lucide-react";

type Cliente = {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
};

export default function ClientesPage() {
  const supabase = createClient();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const { data } = await supabase.from("clientes").select("*").order("nombre");
    setClientes(data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    if (!nombre.trim()) return;
    setGuardando(true);
    await supabase.from("clientes").insert({
      nombre: nombre.trim(),
      direccion: direccion.trim() || null,
      telefono: telefono.trim() || null,
    });
    setGuardando(false);
    setAbierto(false);
    setNombre("");
    setDireccion("");
    setTelefono("");
    cargar();
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl pb-24">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl">Clientes</h1>
          <button
            onClick={() => setAbierto(true)}
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-accent text-accent-text font-medium px-4 py-2 text-sm"
          >
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>
        <p className="text-text-dim text-sm mb-6">
          {clientes.length} clientes registrados
        </p>

        <div className="border border-border rounded-xl overflow-hidden bg-surface">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0 hover:bg-surface-raised transition"
            >
              <div>
                <p className="font-medium text-sm">{c.nombre}</p>
                {c.direccion && (
                  <p className="text-text-dim text-xs">{c.direccion}</p>
                )}
              </div>
              {c.telefono && (
                <span className="text-text-dim text-sm">{c.telefono}</span>
              )}
            </Link>
          ))}
          {!cargando && clientes.length === 0 && (
            <p className="text-text-dim text-sm text-center py-10">
              Aún no tienes clientes registrados.
            </p>
          )}
        </div>
      </main>

      <button
        onClick={() => setAbierto(true)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-accent text-accent-text font-semibold rounded-full pl-5 pr-6 py-4 shadow-lg shadow-black/40 active:scale-[0.97] transition safe-bottom"
      >
        <Plus size={22} strokeWidth={2.5} />
        Nuevo cliente
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="bg-surface border border-border rounded-t-2xl md:rounded-2xl p-5 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">Nuevo cliente</h2>
              <button onClick={() => setAbierto(false)} className="text-text-dim">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección (opcional)"
                className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={crear}
                disabled={guardando || !nombre.trim()}
                className="w-full rounded-xl bg-accent text-accent-text font-semibold py-3 text-sm disabled:opacity-60"
              >
                {guardando ? "Creando..." : "Crear cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
