import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { notFound } from "next/navigation";
import DataTable, { type TableRow } from "@/components/DataTable";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("id, estado, total_materiales, total_mano_obra, created_at")
    .eq("cliente_id", id)
    .order("created_at", { ascending: false });

  const rows: TableRow[] = (cotizaciones ?? []).map((c) => ({
    id: c.id,
    href: `/cotizacion/${c.id}`,
    cliente: cliente.nombre,
    detalle: `$${(
      (c.total_materiales ?? 0) + (c.total_mano_obra ?? 0)
    ).toLocaleString("es-CL")}`,
    status: c.estado,
    fecha: c.created_at,
  }));

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl">
        <h1 className="font-display text-2xl mb-1">{cliente.nombre}</h1>
        <p className="text-text-dim text-sm mb-6">
          {cliente.direccion ?? "Sin dirección"}
          {cliente.telefono ? ` · ${cliente.telefono}` : ""}
        </p>

        <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
          Cotizaciones
        </h2>
        <DataTable
          rows={rows}
          columnaDetalle="Total"
          emptyLabel="Sin cotizaciones para este cliente todavía."
        />
      </main>
    </div>
  );
}
