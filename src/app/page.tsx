import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, MapPin, User } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import DashboardTabs from "@/components/DashboardTabs";
import { StatusBadge } from "@/components/StatusBadge";
import Sidebar from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import DataTable, { type TableRow } from "@/components/DataTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [visitasRes, cotizacionesRes, obrasRes] = await Promise.all([
    supabase
      .from("visitas_terreno")
      .select("id, fecha, estado, clientes(nombre, direccion)")
      .in("estado", ["pendiente", "diagrama", "cotizando"])
      .order("fecha", { ascending: false }),
    supabase
      .from("cotizaciones")
      .select("id, estado, total_materiales, total_mano_obra, created_at, clientes(nombre)")
      .order("created_at", { ascending: false }),
    supabase
      .from("obras_ejecucion")
      .select("id, estado, avance_porcentaje, created_at, clientes(nombre)")
      .order("created_at", { ascending: false }),
  ]);

  const visitas = visitasRes.data ?? [];
  const cotizaciones = cotizacionesRes.data ?? [];
  const obras = obrasRes.data ?? [];

  const cotizacionesAbiertas = cotizaciones.filter((c) =>
    ["BORRADOR", "EN_PROVEEDORES", "ENVIADA"].includes(c.estado)
  );
  const obrasEnCurso = obras.filter((o) => o.estado === "EN_CURSO");
  const pipelineTotal = cotizacionesAbiertas.reduce(
    (sum, c) => sum + (c.total_materiales ?? 0) + (c.total_mano_obra ?? 0),
    0
  );

  const visitasRows: TableRow[] = visitas.map((v) => ({
    id: v.id,
    href: `/visita/${v.id}`,
    cliente:
      (v.clientes as unknown as { nombre: string } | null)?.nombre ??
      "Cliente sin nombre",
    detalle:
      (v.clientes as unknown as { direccion: string } | null)?.direccion ??
      "—",
    status: v.estado,
    fecha: v.fecha,
  }));

  const cotizacionesRows: TableRow[] = cotizacionesAbiertas.map((c) => ({
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

  const obrasRows: TableRow[] = obrasEnCurso.map((o) => ({
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

      <div className="flex-1 md:pl-64">
        {/* Header mobile */}
        <header className="md:hidden sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl">SEL Control</h1>
            <p className="text-text-dim text-xs">Servicios Eléctricos López</p>
          </div>
          <LogoutButton />
        </header>

        {/* Vista mobile: pestañas + tarjetas */}
        <DashboardTabs
          visitas={
            <ColumnList
              emptyLabel="Sin visitas pendientes"
              items={visitasRows}
            />
          }
          cotizaciones={
            <ColumnList
              emptyLabel="Sin cotizaciones abiertas"
              items={cotizacionesRows}
            />
          }
          obras={
            <ColumnList emptyLabel="Sin obras en curso" items={obrasRows} />
          }
        />

        <Link
          href="/visita/nueva"
          className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-accent text-accent-text font-semibold rounded-full pl-5 pr-6 py-4 shadow-lg shadow-black/40 active:scale-[0.97] transition safe-bottom"
        >
          <Plus size={22} strokeWidth={2.5} />
          Nueva visita
        </Link>

        {/* Vista escritorio: panel de gestión */}
        <main className="hidden md:block px-8 py-8 max-w-6xl">
          <h1 className="font-display text-2xl mb-1">Tablero</h1>
          <p className="text-text-dim text-sm mb-6">
            Resumen general de la operación
          </p>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Visitas pendientes" value={String(visitas.length)} />
            <StatCard
              label="Cotizaciones abiertas"
              value={String(cotizacionesAbiertas.length)}
            />
            <StatCard label="Obras en curso" value={String(obrasEnCurso.length)} />
            <StatCard
              label="Pipeline cotizado"
              value={`$${pipelineTotal.toLocaleString("es-CL")}`}
              accent
            />
          </div>

          <section className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              Visitas pendientes
            </h2>
            <DataTable
              rows={visitasRows}
              columnaDetalle="Dirección"
              emptyLabel="Sin visitas pendientes"
            />
          </section>

          <section className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              Cotizaciones
            </h2>
            <DataTable
              rows={cotizacionesRows}
              columnaDetalle="Total"
              emptyLabel="Sin cotizaciones abiertas"
            />
          </section>

          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              Obras en ejecución
            </h2>
            <DataTable
              rows={obrasRows}
              columnaDetalle="Avance"
              emptyLabel="Sin obras en curso"
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function ColumnList({
  items,
  emptyLabel,
}: {
  items: TableRow[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-text-dim text-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="block bg-surface border border-border rounded-2xl p-4 active:bg-surface-raised transition"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <User size={16} className="text-text-dim shrink-0" />
              <span className="font-medium truncate">{item.cliente}</span>
            </div>
            <StatusBadge status={item.status} />
          </div>
          {item.detalle && (
            <div className="flex items-center gap-1.5 text-text-dim text-sm">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{item.detalle}</span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
