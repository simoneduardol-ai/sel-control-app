import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("catalogo_items")
    .select("id, nombre_item, unidad, categoria, costo_mano_obra_referencial")
    .order("categoria")
    .order("nombre_item");

  const porCategoria = new Map<string, typeof items>();
  (items ?? []).forEach((item) => {
    const lista = porCategoria.get(item.categoria) ?? [];
    lista.push(item);
    porCategoria.set(item.categoria, lista);
  });

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl pb-24">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl">Catálogo de ítems</h1>
          <Link
            href="/catalogo/nuevo"
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-accent text-accent-text font-medium px-4 py-2 text-sm"
          >
            <Plus size={16} /> Nuevo ítem
          </Link>
        </div>
        <p className="text-text-dim text-sm mb-6">
          Plantillas reutilizables de mano de obra + materiales para armar cotizaciones rápido
        </p>

        {Array.from(porCategoria.entries()).map(([categoria, lista]) => (
          <section key={categoria} className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              {categoria}
            </h2>
            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              {(lista ?? []).map((item) => (
                <Link
                  key={item.id}
                  href={`/catalogo/${item.id}`}
                  className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0 hover:bg-surface-raised transition"
                >
                  <span className="text-sm font-medium">{item.nombre_item}</span>
                  <span className="text-text-dim text-xs shrink-0 ml-3">
                    {item.unidad}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {(!items || items.length === 0) && (
          <p className="text-text-dim text-sm text-center py-10">
            Aún no tienes ítems en el catálogo.
          </p>
        )}
      </main>

      <Link
        href="/catalogo/nuevo"
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-accent text-accent-text font-semibold rounded-full pl-5 pr-6 py-4 shadow-lg shadow-black/40 active:scale-[0.97] transition safe-bottom"
      >
        <Plus size={22} strokeWidth={2.5} />
        Nuevo ítem
      </Link>
    </div>
  );
}
