import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import DataTable, { type TableRow } from "@/components/DataTable";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("id, estado, total_materiales, total_mano_obra, total_equipos, created_at, clientes(nombre)")
    .order("created_at", { ascending: false });

  const rows: TableRow[] = (cotizaciones ?? []).map((c) => ({
    id: c.id,
    href: `/cotizacion/${c.id}`,
    cliente:
      (c.clientes as unknown as { nombre: string } | null)?.nombre ??
      "Cliente sin nombre",
    detalle: `$${(
      (c.total_materiales ?? 0) + (c.total_mano_obra ?? 0) + (c.total_equipos ?? 0)
    ).toLocaleString("es-CL")}`,
    status: c.estado,
    fecha: c.created_at,
  }));

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-5xl pb-24">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl">Cotizaciones</h1>
          <Link
            href="/cotizacion/nueva"
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-accent text-accent-text font-medium px-4 py-2 text-sm"
          >
            <Plus size={16} /> Nueva cotización
          </Link>
        </div>
        <p className="text-text-dim text-sm mb-6">
          {rows.length} cotizaciones en total
        </p>
        <DataTable
          rows={rows}
          columnaDetalle="Total"
          emptyLabel="Aún no has creado cotizaciones."
        />
      </main>

      <Link
        href="/cotizacion/nueva"
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-accent text-accent-text font-semibold rounded-full pl-5 pr-6 py-4 shadow-lg shadow-black/40 active:scale-[0.97] transition safe-bottom"
      >
        <Plus size={22} strokeWidth={2.5} />
        Nueva cotización
      </Link>
    </div>
  );
}
