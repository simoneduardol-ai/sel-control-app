import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DataTable, { type TableRow } from "@/components/DataTable";

export const dynamic = "force-dynamic";

export default async function InspeccionesPage() {
  const supabase = await createClient();

  const { data: inspecciones } = await supabase
    .from("inspecciones_electricas")
    .select("id, numero_ot, fecha_visita, estado_visita, diagnostico_rapido, clientes(nombre)")
    .order("created_at", { ascending: false });

  const rows: TableRow[] = (inspecciones ?? []).map((i) => ({
    id: i.id,
    href: `/inspeccion/${i.id}`,
    cliente:
      (i.clientes as unknown as { nombre: string } | null)?.nombre ??
      "Cliente sin nombre",
    detalle: i.numero_ot || i.diagnostico_rapido || "Inspección eléctrica",
    status: i.estado_visita || "Sin estado",
    fecha: i.fecha_visita,
  }));

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-5xl pb-24">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl">Inspecciones eléctricas</h1>
          <Link
            href="/inspeccion/nueva"
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-accent text-accent-text font-medium px-4 py-2 text-sm"
          >
            <Plus size={16} /> Nueva inspección
          </Link>
        </div>
        <p className="text-text-dim text-sm mb-6">
          {rows.length} inspecciones registradas
        </p>
        <DataTable
          rows={rows}
          columnaDetalle="Detalle"
          emptyLabel="Sin inspecciones registradas todavía."
        />
      </main>

      <Link
        href="/inspeccion/nueva"
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-accent text-accent-text font-semibold rounded-full pl-5 pr-6 py-4 shadow-lg shadow-black/40 active:scale-[0.97] transition safe-bottom"
      >
        <Plus size={22} strokeWidth={2.5} />
        Nueva inspección
      </Link>
    </div>
  );
}
