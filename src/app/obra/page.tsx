import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import DataTable, { type TableRow } from "@/components/DataTable";

export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const supabase = await createClient();
  const { data: obras } = await supabase
    .from("obras_ejecucion")
    .select("id, estado, avance_porcentaje, created_at, clientes(nombre)")
    .order("created_at", { ascending: false });

  const rows: TableRow[] = (obras ?? []).map((o) => ({
    id: o.id,
    href: `/obra/${o.id}`,
    cliente:
      (o.clientes as unknown as { nombre: string } | null)?.nombre ??
      "Cliente sin nombre",
    detalle: `${o.avance_porcentaje ?? 0}% de avance`,
    status: o.estado,
    fecha: o.created_at,
  }));

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-5xl">
        <h1 className="font-display text-2xl mb-1">Obras</h1>
        <p className="text-text-dim text-sm mb-6">{rows.length} obras en total</p>
        <DataTable
          rows={rows}
          columnaDetalle="Avance"
          emptyLabel="Aún no hay obras en ejecución. Se crean automáticamente al aprobar una cotización."
        />
      </main>
    </div>
  );
}
