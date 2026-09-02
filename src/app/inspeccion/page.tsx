import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function InspeccionesPage() {
  const supabase = await createClient();

  const { data: inspecciones } = await supabase
    .from("inspecciones_electricas")
    .select("id, numero_ot, fecha_visita, estado_visita, diagnostico_rapido, clientes(nombre)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-3xl pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl mb-1">Inspecciones eléctricas</h1>
            <p className="text-text-dim text-sm">
              {inspecciones?.length ?? 0} inspecciones registradas
            </p>
          </div>
          <Link
            href="/inspeccion/nueva"
            className="flex items-center gap-1.5 bg-accent text-accent-text rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} /> Nueva
          </Link>
        </div>

        {(!inspecciones || inspecciones.length === 0) && (
          <p className="text-text-dim text-sm text-center py-16">
            Sin inspecciones registradas todavía.
          </p>
        )}

        <div className="space-y-2">
          {(inspecciones ?? []).map((i) => {
            const cliente = i.clientes as unknown as { nombre: string } | null;
            return (
              <Link
                key={i.id}
                href={`/inspeccion/${i.id}`}
                className="block bg-surface border border-border rounded-xl p-4 hover:bg-surface-raised transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {cliente?.nombre ?? "Sin cliente"}
                  </span>
                  {i.numero_ot && (
                    <span className="text-text-dim text-xs">{i.numero_ot}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-text-dim text-xs">
                    {i.fecha_visita
                      ? new Date(i.fecha_visita + "T00:00:00").toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Sin fecha"}
                    {i.diagnostico_rapido ? ` · ${i.diagnostico_rapido}` : ""}
                  </span>
                  {i.estado_visita && (
                    <span className="text-xs bg-bg border border-border rounded-full px-2 py-0.5">
                      {i.estado_visita}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
