import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import CopyPromptButton from "@/components/CopyPromptButton";
import Sidebar from "@/components/Sidebar";

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

      <div className="px-5 md:px-8 py-5 max-w-2xl space-y-8">
        {cliente?.direccion && (
          <p className="text-text-dim text-sm">{cliente.direccion}</p>
        )}

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
            <h2 className="text-sm font-medium text-text-dim mb-2">Notas</h2>
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

        {visita.prompt_diagrama_ia && (
          <section>
            <h2 className="text-sm font-medium text-text-dim mb-2">
              Prompt para generar diagrama
            </h2>
            <pre className="bg-surface border border-border rounded-xl p-4 text-xs whitespace-pre-wrap font-sans">
              {visita.prompt_diagrama_ia}
            </pre>
            <CopyPromptButton text={visita.prompt_diagrama_ia} />
          </section>
        )}
      </div>
      </main>
    </div>
  );
}
