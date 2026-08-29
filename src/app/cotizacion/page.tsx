import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import DataTable, { type TableRow } from "@/components/DataTable";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("id, estado, total_materiales, total_mano_obra, created_at, clientes(nombre)")
    .order("created_at", { ascending: false });

  const rows: TableRow[] = (cotizaciones ?? []).map((c) => ({
    id: c.id,
    href: `/cotizacion/${c.id}`,
    cliente:
      (c.clientes as unknown as { nombre: string } | null)?.nombre ??
      "Cliente sin nombre",
    detalle: `$${(
      (c.total_materiales ?? 0) + (c.total_mano_obra ?? 0)
    ).toLocaleString("es-CL")}`,
    status: c.estado,
    fecha: c.created_at,
  }));

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-5xl">
        <h1 className="font-display text-2xl mb-1">Cotizaciones</h1>
        <p className="text-text-dim text-sm mb-6">
          {rows.length} cotizaciones en total
        </p>
        <DataTable
          rows={rows}
          columnaDetalle="Total"
          emptyLabel="Aún no has creado cotizaciones."
        />
      </main>
    </div>
  );
}
