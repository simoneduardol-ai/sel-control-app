import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, FileText, FileCheck, HardHat, FilePlus2, Pencil, History } from "lucide-react";
import { notFound } from "next/navigation";
import CopyPromptButton from "@/components/CopyPromptButton";
import Sidebar from "@/components/Sidebar";
import { StatusBadge } from "@/components/StatusBadge";
import DiagramaUploader from "@/components/DiagramaUploader";

export const dynamic = "force-dynamic";

export default async function VisitaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: visita } = await supabase
    .from("visitas_terreno")
    .select("*, clientes(nombre, direccion, telefono)")
    .eq("id", id)
    .single();

  if (!visita) notFound();

  const cliente = visita.clientes as unknown as {
    nombre: string;
    direccion: string | null;
    telefono: string | null;
  } | null;

  const fotoUrls: string[] = await Promise.all(
    (visita.fotos ?? []).map(async (path: string) => {
      const { data } = await supabase.storage
        .from("visitas-media")
        .createSignedUrl(path, 3600);
      return data?.signedUrl ?? "";
    })
  );

  let audioSignedUrl: string | null = null;
  if (visita.notas_voz_url) {
    const { data } = await supabase.storage
      .from("visitas-media")
      .createSignedUrl(visita.notas_voz_url, 3600);
    audioSignedUrl = data?.signedUrl ?? null;
  }

  const medidas = (visita.medidas ?? {}) as Record<string, string>;

  let diagramaUrl: string | null = null;
  if (visita.diagrama_url) {
    const { data } = await supabase.storage
      .from("visitas-media")
      .createSignedUrl(visita.diagrama_url, 3600);
    diagramaUrl = data?.signedUrl ?? null;
  }
  const esDiagramaImagen = visita.diagrama_url && !visita.diagrama_url.toLowerCase().endsWith(".pdf");

  const { data: cotizacionRelacionada } = await supabase
    .from("cotizaciones")
    .select("id, estado")
    .eq("visita_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let obraRelacionada: { id: string; avance_porcentaje: number } | null = null;
  if (cotizacionRelacionada) {
    const { data: obra } = await supabase
      .from("obras_ejecucion")
      .select("id, avance_porcentaje")
      .eq("cotizacion_id", cotizacionRelacionada.id)
      .maybeSingle();
    obraRelacionada = obra;
  }

  const { data: historialVersiones } = await supabase
    .from("visitas_historial")
    .select("id, etiqueta_version, drive_url, created_at")
    .eq("visita_id", id)
    .order("created_at", { ascending: false });

  const { data: inspeccionRelacionada } = await supabase
    .from("inspecciones_electricas")
    .select("id, numero_ot, estado_visita")
    .eq("visita_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16">
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <Link href="/" className="p-1 -ml-1 text-text-dim md:hidden">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-lg flex-1">{cliente?.nombre}</h1>
        <Link
          href={`/visita/${visita.id}/editar`}
          className="flex items-center gap-1.5 text-accent text-sm font-medium"
        >
          <Pencil size={15} /> Editar
        </Link>
      </header>

      <div className="px-5 md:px-8 py-5 max-w-2xl space-y-8">
        {cliente?.direccion && (
          <p className="text-text-dim text-sm">{cliente.direccion}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-dim text-xs">
          <span>
            {new Date(visita.fecha).toLocaleString("es-CL", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </span>
          {visita.persona_en_terreno && (
            <span>Atendió: {visita.persona_en_terreno}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visita.tipo_trabajo && (
            <span className="text-xs font-medium bg-surface border border-border rounded-full px-3 py-1">
              {visita.tipo_trabajo}
            </span>
          )}
          {visita.estado_seguimiento && (
            <StatusBadge status={visita.estado_seguimiento} />
          )}
          {(visita.etiquetas ?? []).map((et: string) => (
            <span
              key={et}
              className="text-xs bg-accent/10 text-accent rounded-full px-3 py-1"
            >
              {et}
            </span>
          ))}
        </div>

        <section className="grid grid-cols-2 gap-3">
          <Link
            href={`/visita/${visita.id}/imprimir`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-medium"
          >
            <FileText size={16} /> Respaldo interno
          </Link>
          {visita.requiere_informe_cliente && (
            <Link
              href={`/visita/${visita.id}/informe`}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-text py-3 text-sm font-medium"
            >
              <FileCheck size={16} /> Informe cliente
            </Link>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">
            Cotización de esta visita
          </h2>
          {cotizacionRelacionada ? (
            <Link
              href={`/cotizacion/${cotizacionRelacionada.id}`}
              className="flex items-center justify-between bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2">
                <StatusBadge status={cotizacionRelacionada.estado} />
                {obraRelacionada && (
                  <span className="flex items-center gap-1 text-xs text-ok">
                    <HardHat size={13} /> Obra en curso · {obraRelacionada.avance_porcentaje}%
                  </span>
                )}
              </div>
              <span className="text-accent text-sm font-medium">Ver →</span>
            </Link>
          ) : (
            <Link
              href={`/cotizacion/nueva?cliente_id=${visita.cliente_id}&visita_id=${visita.id}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-text-dim"
            >
              <FilePlus2 size={16} /> Crear cotización desde esta visita
            </Link>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">
            Inspección eléctrica de esta visita
          </h2>
          {inspeccionRelacionada ? (
            <Link
              href={`/inspeccion/${inspeccionRelacionada.id}`}
              className="flex items-center justify-between bg-surface border border-border rounded-xl p-4"
            >
              <span className="text-sm">
                {inspeccionRelacionada.numero_ot ?? "Sin número"}
                {inspeccionRelacionada.estado_visita && ` · ${inspeccionRelacionada.estado_visita}`}
              </span>
              <span className="text-accent text-sm font-medium">Ver →</span>
            </Link>
          ) : (
            <Link
              href={`/inspeccion/nueva?cliente_id=${visita.cliente_id}&visita_id=${visita.id}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-text-dim"
            >
              <FilePlus2 size={16} /> Crear inspección eléctrica desde esta visita
            </Link>
          )}
        </section>

        {fotoUrls.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">Fotos</h2>
            <div className="grid grid-cols-3 gap-2">
              {fotoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="aspect-square rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {visita.carpeta_fotos_drive_url && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">
              Carpeta de fotos (Drive)
            </h2>
            <a
              href={visita.carpeta_fotos_drive_url}
              target="_blank"
              rel="noreferrer"
              className="block bg-surface border border-border rounded-xl p-4 text-sm text-accent font-medium truncate"
            >
              {visita.carpeta_fotos_drive_url}
            </a>
          </section>
        )}

        {visita.pdf_drive_url && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">
              Respaldo archivado en Drive
            </h2>
            <a
              href={visita.pdf_drive_url}
              target="_blank"
              rel="noreferrer"
              className="block bg-ok/10 border border-ok/20 rounded-xl p-4 text-sm text-ok font-medium truncate"
            >
              Ver PDF en Drive ↗
            </a>
          </section>
        )}

        {audioSignedUrl && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">
              Nota de voz
            </h2>
            <audio src={audioSignedUrl} controls className="w-full" />
          </section>
        )}

        {visita.notas_voz_transcripcion && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">Notas / Descripción de la actividad</h2>
            <p className="bg-surface border border-border rounded-xl p-4 text-sm">
              {visita.notas_voz_transcripcion}
            </p>
          </section>
        )}

        {Object.keys(medidas).length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">Medidas</h2>
            <div className="bg-surface border border-border rounded-xl divide-y divide-border">
              {Object.entries(medidas).map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-text-dim">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-medium text-text-dim mb-2">
            Detalles de la visita
          </h2>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border text-sm">
            {visita.referido_por && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-dim">Referido por</span>
                <span className="font-medium">{visita.referido_por}</span>
              </div>
            )}
            {visita.equipos_utilizados && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-dim">Equipos utilizados</span>
                <span className="font-medium">{visita.equipos_utilizados}</span>
              </div>
            )}
            {visita.costo_equipos > 0 && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-dim">Costo equipos</span>
                <span className="font-medium">
                  ${Number(visita.costo_equipos).toLocaleString("es-CL")}
                </span>
              </div>
            )}
            {visita.km_recorridos > 0 && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-dim">Km recorridos</span>
                <span className="font-medium">{visita.km_recorridos}</span>
              </div>
            )}
            {visita.total_estimado > 0 && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-dim">Total estimado</span>
                <span className="font-medium">
                  ${Number(visita.total_estimado).toLocaleString("es-CL")}
                </span>
              </div>
            )}
            {visita.notas_cliente && (
              <div className="px-4 py-3">
                <span className="text-text-dim block mb-1">Notas del cliente</span>
                <span className="font-medium">{visita.notas_cliente}</span>
              </div>
            )}
          </div>
        </section>

        {visita.prompt_diagrama_ia && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">
              Prompt para generar diagrama
            </h2>
            <pre className="bg-surface border border-border rounded-xl p-4 text-xs whitespace-pre-wrap font-sans">
              {visita.prompt_diagrama_ia}
            </pre>
            <CopyPromptButton text={visita.prompt_diagrama_ia} />

            <div className="mt-4">
              <h3 className="text-sm font-medium text-text-dim mb-2">Diagrama</h3>
              {diagramaUrl ? (
                <div className="space-y-2">
                  {esDiagramaImagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={diagramaUrl}
                      alt="Diagrama"
                      className="w-full rounded-xl border border-border"
                    />
                  ) : (
                    <a
                      href={diagramaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-surface border border-border rounded-xl p-4 text-sm text-accent font-medium"
                    >
                      Ver diagrama (PDF) ↗
                    </a>
                  )}
                  <DiagramaUploader visitaId={visita.id} />
                </div>
              ) : (
                <div className="bg-surface border border-dashed border-border rounded-xl p-4">
                  <p className="text-text-dim text-xs mb-2">
                    Cuando tengas el diagrama listo (hecho con otra IA, o aportado por el
                    cliente), súbelo aquí.
                  </p>
                  <DiagramaUploader visitaId={visita.id} />
                </div>
              )}
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
                      <a
                        href={v.drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent text-xs font-medium"
                      >
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
