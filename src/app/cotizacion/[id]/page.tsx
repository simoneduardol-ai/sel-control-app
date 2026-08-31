import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import Sidebar from "@/components/Sidebar";
import EmitirPdfButton from "@/components/EmitirPdfButton";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!cotizacion) notFound();

  const { data: etapas } = await supabase
    .from("cotizacion_etapas")
    .select("*, cotizacion_items_apu(*)")
    .eq("cotizacion_id", id)
    .order("orden");

  const cliente = cotizacion.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  const total =
    (cotizacion.total_materiales ?? 0) + (cotizacion.total_mano_obra ?? 0);

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16">
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <Link href="/" className="p-1 -ml-1 text-text-dim md:hidden">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-lg">{cliente?.nombre}</h1>
      </header>

      <div className="px-5 md:px-8 py-5 max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <StatusBadge status={cotizacion.estado} />
          <span className="font-display text-xl">
            ${total.toLocaleString("es-CL")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <EmitirPdfButton cotizacionId={cotizacion.id} />
          <Link
            href={`/cotizacion/${cotizacion.id}/proveedores`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-medium"
          >
            <Users size={16} /> Proveedores
          </Link>
        </div>

        {(etapas ?? []).map((etapa) => (
          <section key={etapa.id}>
            <h2 className="text-sm font-medium text-text-dim mb-2">
              {etapa.nombre_etapa}
            </h2>
            <div className="bg-surface border border-border rounded-xl divide-y divide-border">
              {(etapa.cotizacion_items_apu ?? []).map(
                (item: {
                  id: string;
                  descripcion_item: string;
                  cantidad: number;
                  unidad: string;
                  costo_total_calculado: number;
                }) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex justify-between text-sm">
                      <span>{item.descripcion_item}</span>
                      <span className="font-medium">
                        ${item.costo_total_calculado.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <span className="text-text-dim text-xs">
                      {item.cantidad} {item.unidad}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        ))}

        {(!etapas || etapas.length === 0) && (
          <p className="text-text-dim text-sm text-center py-12">
            Sin ítems cargados todavía. La carga de ítems APU y emisión de PDF
            se habilita en la siguiente fase.
          </p>
        )}
      </div>
      </main>
    </div>
  );
}
