import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function InformeClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: visita } = await supabase
    .from("visitas_terreno")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!visita) notFound();

  const cliente = visita.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  const fotoUrls: string[] = await Promise.all(
    (visita.fotos ?? []).slice(0, 6).map(async (path: string) => {
      const { data } = await supabase.storage
        .from("visitas-media")
        .createSignedUrl(path, 3600);
      return data?.signedUrl ?? "";
    })
  );

  const fecha = new Date(visita.fecha).toLocaleDateString("es-CL", {
    dateStyle: "long",
  });

  return (
    <div className="min-h-dvh bg-white text-black">
      <PrintButton />
      <div className="max-w-2xl mx-auto px-8 py-10 print:px-0 print:py-0">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-6">
          <div className="h-12 w-12 rounded-full overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.jpg"
              alt="SEL"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg">Servicios Eléctricos López</h1>
            <p className="text-sm text-gray-500">
              Informe de {visita.tipo_trabajo || "visita técnica"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500 mb-0.5">Cliente</p>
            <p>{cliente?.nombre}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 mb-0.5">Fecha</p>
            <p>{fecha}</p>
          </div>
          {cliente?.direccion && (
            <div className="col-span-2">
              <p className="text-xs uppercase text-gray-500 mb-0.5">Dirección</p>
              <p>{cliente.direccion}</p>
            </div>
          )}
        </div>

        {visita.notas_voz_transcripcion && (
          <div className="mb-8">
            <h2 className="font-semibold text-sm uppercase tracking-wide mb-2">
              Hallazgos y observaciones
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {visita.notas_voz_transcripcion}
            </p>
          </div>
        )}

        {fotoUrls.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-sm uppercase tracking-wide mb-2">
              Registro fotográfico
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {fotoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="aspect-square rounded-lg object-cover border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}

        {visita.total_estimado > 0 && (
          <div className="mb-8 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Estimado preliminar</span>
              <span className="font-bold text-lg">
                ${Number(visita.total_estimado).toLocaleString("es-CL")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sujeto a confirmación en la cotización formal.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-10 pt-4 border-t border-gray-200">
          Servicios Eléctricos López — Certificación SEC Clase D
        </p>
      </div>
    </div>
  );
}
