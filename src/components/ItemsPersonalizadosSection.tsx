"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, ClipboardList } from "lucide-react";

type Item = { id: string; descripcion: string; listo: boolean };

export default function ItemsPersonalizadosSection({
  visitaId,
  obraId,
}: {
  visitaId?: string;
  obraId?: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    let query = supabase
      .from("items_personalizados_visita")
      .select("id, descripcion, listo")
      .order("created_at", { ascending: true });
    query = visitaId ? query.eq("visita_id", visitaId) : query.eq("obra_id", obraId);
    const { data } = await query;
    setItems(data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitaId, obraId]);

  async function agregar() {
    if (!nuevoTexto.trim()) return;
    setGuardando(true);
    await supabase.from("items_personalizados_visita").insert({
      visita_id: visitaId ?? null,
      obra_id: obraId ?? null,
      descripcion: nuevoTexto.trim(),
    });
    setNuevoTexto("");
    setGuardando(false);
    cargar();
  }

  async function toggle(item: Item) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, listo: !i.listo } : i))
    );
    await supabase
      .from("items_personalizados_visita")
      .update({ listo: !item.listo })
      .eq("id", item.id);
  }

  async function quitar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("items_personalizados_visita").delete().eq("id", id);
  }

  if (cargando) return null;

  return (
    <section>
      <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-2 flex items-center gap-1.5">
        <ClipboardList size={14} /> Cosas a llevar (personalizado)
      </h2>
      <div className="border border-border rounded-xl bg-surface divide-y divide-border mb-2">
        {items.length === 0 && (
          <p className="text-text-dim text-sm text-center py-6">
            Sin ítems agregados todavía.
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
            <input
              type="checkbox"
              checked={item.listo}
              onChange={() => toggle(item)}
              className="h-4 w-4 accent-accent shrink-0"
            />
            <span
              className={`flex-1 text-sm ${
                item.listo ? "line-through text-text-dim" : ""
              }`}
            >
              {item.descripcion}
            </span>
            <button onClick={() => quitar(item.id)} className="text-text-dim shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregar()}
          placeholder="Ej: destornillador plano largo, etiqueta duro..."
          className="flex-1 rounded-lg bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={agregar}
          disabled={guardando || !nuevoTexto.trim()}
          className="rounded-lg bg-accent text-accent-text px-3 py-2 disabled:opacity-60"
        >
          <Plus size={16} />
        </button>
      </div>
    </section>
  );
}
