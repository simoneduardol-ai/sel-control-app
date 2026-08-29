"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Plus, Search } from "lucide-react";

export type ClienteOption = {
  id: string;
  nombre: string;
  direccion: string | null;
};

export default function ClienteSelector({
  value,
  onChange,
}: {
  value: ClienteOption | null;
  onChange: (cliente: ClienteOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ClienteOption[]>([]);
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (query.trim() === "") {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nombre, direccion")
        .ilike("nombre", `%${query}%`)
        .limit(5);
      setResultados(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function crearCliente() {
    if (!nuevoNombre.trim()) return;
    setGuardando(true);
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre: nuevoNombre.trim(),
        direccion: nuevaDireccion.trim() || null,
        telefono: nuevoTelefono.trim() || null,
      })
      .select("id, nombre, direccion")
      .single();
    setGuardando(false);
    if (!error && data) {
      onChange(data);
      setCreandoNuevo(false);
      setNuevoNombre("");
      setNuevaDireccion("");
      setNuevoTelefono("");
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3.5">
        <div>
          <p className="font-medium">{value.nombre}</p>
          {value.direccion && (
            <p className="text-text-dim text-sm">{value.direccion}</p>
          )}
        </div>
        <button
          onClick={() => onChange(null)}
          className="text-accent text-sm font-medium"
        >
          Cambiar
        </button>
      </div>
    );
  }

  if (creandoNuevo) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nombre del cliente"
          className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          autoFocus
        />
        <input
          value={nuevaDireccion}
          onChange={(e) => setNuevaDireccion(e.target.value)}
          placeholder="Dirección (opcional)"
          className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          value={nuevoTelefono}
          onChange={(e) => setNuevoTelefono(e.target.value)}
          placeholder="Teléfono (opcional)"
          className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setCreandoNuevo(false)}
            className="flex-1 rounded-lg py-2.5 text-sm text-text-dim border border-border"
          >
            Cancelar
          </button>
          <button
            onClick={crearCliente}
            disabled={guardando || !nuevoNombre.trim()}
            className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-accent text-accent-text disabled:opacity-60"
          >
            {guardando ? "Creando..." : "Crear cliente"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full rounded-xl bg-surface border border-border pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {resultados.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {resultados.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange(c)}
              className="w-full flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 text-left"
            >
              <div>
                <p className="font-medium text-sm">{c.nombre}</p>
                {c.direccion && (
                  <p className="text-text-dim text-xs">{c.direccion}</p>
                )}
              </div>
              <Check size={16} className="text-text-dim" />
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setCreandoNuevo(true)}
        className="mt-2 flex items-center gap-1.5 text-accent text-sm font-medium"
      >
        <Plus size={16} /> Crear cliente nuevo
      </button>
    </div>
  );
}
