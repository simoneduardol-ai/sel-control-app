import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre");

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl">
        <h1 className="font-display text-2xl mb-1">Clientes</h1>
        <p className="text-text-dim text-sm mb-6">
          {clientes?.length ?? 0} clientes registrados
        </p>

        <div className="border border-border rounded-xl overflow-hidden bg-surface">
          {(clientes ?? []).map((c) => (
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
          {(!clientes || clientes.length === 0) && (
            <p className="text-text-dim text-sm text-center py-10">
              Aún no tienes clientes registrados.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
