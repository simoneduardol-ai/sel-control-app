import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ObraAccionesEstado from "@/components/ObraAccionesEstado";
import HistorialEstados from "@/components/HistorialEstados";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ObraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: obra } = await supabase
    .from("obras_ejecucion")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!obra) notFound();

  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select("id, numero_cotizacion")
    .eq("id", obra.cotizacion_id)
    .single();

  const { data: bitacora } = await supabase
    .from("bitacora_obra")
    .select("*")
    .eq("obra_id", id)
    .order("fecha_visita", { ascending: false });

  const { data: historial } = await supabase
    .from("auditoria_estados")
    .select("id, estado_anterior, estado_nuevo, motivo, created_at")
    .eq("entidad_tipo", "obra")
    .eq("entidad_id", id)
    .order("created_at", { ascending: false })
    .limit(15);

  const cliente = obra.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16">
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <Link href="/" className="p-1 -ml-1 text-text-dim md:hidden">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-lg flex-1">{cliente?.nombre}</h1>
        <StatusBadge status={obra.estado} />
      </header>

      <div className="px-5 md:px-8 py-5 max-w-2xl space-y-6">
        <Link
          href={`/cotizacion/${obra.cotizacion_id}`}
          className="flex items-center justify-between bg-surface border border-border rounded-xl p-4"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <FileText size={16} /> Ver cotización
            {cotizacion?.numero_cotizacion && (
              <span className="text-text-dim">({cotizacion.numero_cotizacion})</span>
            )}
          </span>
          <span className="text-accent text-sm font-medium">Ver →</span>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-text-dim text-xs uppercase tracking-wide mb-1">
              Costo real
            </p>
            <p className="font-display text-lg">
              ${Number(obra.costo_real ?? 0).toLocaleString("es-CL")}
            </p>
            <p className="text-text-dim text-[11px] mt-0.5">
              Se actualiza solo si editas la cotización
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-text-dim text-xs uppercase tracking-wide mb-1">
              Avance
            </p>
            <p className="font-display text-lg">{obra.avance_porcentaje}%</p>
          </div>
        </div>

        <div>
          <div className="h-2.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${obra.avance_porcentaje}%` }}
            />
          </div>
        </div>

        <ObraAccionesEstado
          obraId={obra.id}
          cotizacionId={obra.cotizacion_id}
          numeroCotizacion={cotizacion?.numero_cotizacion ?? null}
          estadoActual={obra.estado}
        />

        <section>
          <h2 className="text-sm font-medium text-text-dim mb-3">Bitácora</h2>
          {(bitacora ?? []).length === 0 ? (
            <p className="text-text-dim text-sm text-center py-8">
              Sin visitas registradas todavía. El botón de &ldquo;agregar
              visita en 10 segundos&rdquo; se habilita en la siguiente fase.
            </p>
          ) : (
            <div className="relative pl-5 space-y-6 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
              {(bitacora ?? []).map((entrada) => (
                <div key={entrada.id} className="relative">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-accent" />
                  <p className="text-xs text-text-dim mb-1">
                    {new Date(entrada.fecha_visita).toLocaleDateString(
                      "es-CL",
                      { day: "numeric", month: "long" }
                    )}
                  </p>
                  <p className="text-sm">{entrada.descripcion_avance}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <HistorialEstados entradas={historial ?? []} />
      </div>
      </main>
    </div>
  );
}
