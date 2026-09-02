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

  const [visitasRes, cotizacionesRes, inspeccionesRes, obrasRes] = await Promise.all([
    supabase
      .from("visitas_terreno")
      .select("id, fecha, estado, tipo_trabajo")
      .eq("cliente_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("cotizaciones")
      .select("id, estado, total_materiales, total_mano_obra, total_equipos, created_at")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("inspecciones_electricas")
      .select("id, fecha_visita, estado_visita, diagnostico_rapido, numero_ot")
      .eq("cliente_id", id)
      .order("fecha_visita", { ascending: false }),
    supabase
      .from("obras_ejecucion")
      .select("id, estado, avance_porcentaje, created_at")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const visitasRows: TableRow[] = (visitasRes.data ?? []).map((v) => ({
    id: v.id,
    href: `/visita/${v.id}`,
    cliente: cliente.nombre,
    detalle: v.tipo_trabajo || "Visita",
    status: v.estado,
    fecha: v.fecha,
  }));

  const cotizacionesRows: TableRow[] = (cotizacionesRes.data ?? []).map((c) => ({
    id: c.id,
    href: `/cotizacion/${c.id}`,
    cliente: cliente.nombre,
    detalle: `$${(
      (c.total_materiales ?? 0) + (c.total_mano_obra ?? 0) + (c.total_equipos ?? 0)
    ).toLocaleString("es-CL")}`,
    status: c.estado,
    fecha: c.created_at,
  }));

  const inspeccionesRows: TableRow[] = (inspeccionesRes.data ?? []).map((i) => ({
    id: i.id,
    href: `/inspeccion/${i.id}`,
    cliente: cliente.nombre,
    detalle: i.numero_ot || i.diagnostico_rapido || "Inspección eléctrica",
    status: i.estado_visita || "Sin estado",
    fecha: i.fecha_visita,
  }));

  const obrasRows: TableRow[] = (obrasRes.data ?? []).map((o) => ({
    id: o.id,
    href: `/obra/${o.id}`,
    cliente: cliente.nombre,
    detalle: `${o.avance_porcentaje ?? 0}% de avance`,
    status: o.estado,
    fecha: o.created_at,
  }));

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl pb-24">
        <h1 className="font-display text-2xl mb-1">{cliente.nombre}</h1>
        <p className="text-text-dim text-sm mb-8">
          {cliente.direccion ?? "Sin dirección"}
          {cliente.telefono ? ` · ${cliente.telefono}` : ""}
        </p>

        <section className="mb-8">
          <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
            Visitas ({visitasRows.length})
          </h2>
          <DataTable
            rows={visitasRows}
            columnaDetalle="Tipo de trabajo"
            emptyLabel="Sin visitas registradas para este cliente todavía."
          />
        </section>

        <section className="mb-8">
          <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
            Cotizaciones ({cotizacionesRows.length})
          </h2>
          <DataTable
            rows={cotizacionesRows}
            columnaDetalle="Total"
            emptyLabel="Sin cotizaciones para este cliente todavía."
          />
        </section>

        <section className="mb-8">
          <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
            Inspecciones eléctricas ({inspeccionesRows.length})
          </h2>
          <DataTable
            rows={inspeccionesRows}
            columnaDetalle="Detalle"
            emptyLabel="Sin inspecciones para este cliente todavía."
          />
        </section>

        <section>
          <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
            Obras ({obrasRows.length})
          </h2>
          <DataTable
            rows={obrasRows}
            columnaDetalle="Avance"
            emptyLabel="Sin obras para este cliente todavía."
          />
        </section>
      </main>
    </div>
  );
}
