import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Pencil, History } from "lucide-react";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import EmitirPdfInspeccionButton from "@/components/EmitirPdfInspeccionButton";

export const dynamic = "force-dynamic";

export default async function InspeccionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inspeccion } = await supabase
    .from("inspecciones_electricas")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!inspeccion) notFound();

  const { data: diferenciales } = await supabase
    .from("inspeccion_diferenciales")
    .select("*")
    .eq("inspeccion_id", id)
    .order("orden");

  const { data: aislaciones } = await supabase
    .from("inspeccion_aislaciones")
    .select("*")
    .eq("inspeccion_id", id)
    .order("orden");

  const { data: historialVersiones } = await supabase
    .from("inspecciones_historial")
    .select("id, etiqueta_version, drive_url, created_at")
    .eq("inspeccion_id", id)
    .order("created_at", { ascending: false });

  const cliente = inspeccion.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link href="/inspeccion" className="p-1 -ml-1 text-text-dim">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-display text-lg flex-1">
            {cliente?.nombre ?? "Sin cliente"}
            {inspeccion.numero_ot && (
              <span className="text-text-dim text-sm font-sans font-normal ml-2">
                {inspeccion.numero_ot}
              </span>
            )}
          </h1>
          <Link
            href={`/inspeccion/${inspeccion.id}/editar`}
            className="flex items-center gap-1.5 text-accent text-sm font-medium"
          >
            <Pencil size={15} /> Editar
          </Link>
        </header>

        <div className="px-5 md:px-8 py-5 max-w-2xl space-y-6">
          {inspeccion.estado_visita && (
            <span className="inline-block text-xs font-medium bg-surface border border-border rounded-full px-3 py-1">
              {inspeccion.estado_visita}
            </span>
          )}

          <EmitirPdfInspeccionButton inspeccionId={inspeccion.id} />

          {inspeccion.fecha_visita && (
            <p className="text-text-dim text-sm">
              {new Date(inspeccion.fecha_visita + "T00:00:00").toLocaleDateString("es-CL", {
                dateStyle: "long",
              })}
              {inspeccion.tecnico && ` · ${inspeccion.tecnico}`}
            </p>
          )}

          {(inspeccion.sintomas ?? []).length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2">Síntomas</h2>
              <div className="flex flex-wrap gap-1.5">
                {inspeccion.sintomas.map((s: string, i: number) => (
                  <span key={i} className="text-xs bg-surface border border-border rounded-full px-2.5 py-1">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {inspeccion.diagnostico_detallado && (
            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2">Diagnóstico</h2>
              <p className="text-sm bg-surface border border-border rounded-xl p-4">
                {inspeccion.diagnostico_detallado}
              </p>
            </section>
          )}

          {diferenciales && diferenciales.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2">Diferenciales medidos</h2>
              <div className="border border-border rounded-xl bg-surface divide-y divide-border">
                {diferenciales.map((d) => (
                  <div key={d.id} className="px-4 py-2.5 text-sm">
                    <span className="font-medium">{d.circuito || "Sin circuito"}</span>
                    <span className="text-text-dim"> — {d.estado || "sin estado"}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {aislaciones && aislaciones.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2">Aislación medida</h2>
              <div className="border border-border rounded-xl bg-surface divide-y divide-border">
                {aislaciones.map((a) => (
                  <div key={a.id} className="px-4 py-2.5 text-sm">
                    <span className="font-medium">{a.circuito || "Sin circuito"}</span>
                    <span className="text-text-dim"> — {a.resultado_final || "sin resultado"}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {historialVersiones && historialVersiones.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-dim mb-2 flex items-center gap-1.5">
                <History size={14} /> Historial de versiones
              </h2>
              <div className="border border-border rounded-xl bg-surface divide-y divide-border">
                {historialVersiones.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="capitalize">{v.etiqueta_version}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-text-dim text-xs">
                        {new Date(v.created_at).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {v.drive_url && (
                        <a href={v.drive_url} target="_blank" rel="noreferrer" className="text-accent text-xs font-medium">
                          Ver ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-text-dim text-xs mt-2">
                Esta pantalla siempre muestra la versión más reciente. Los respaldos
                anteriores quedan archivados en Drive.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
