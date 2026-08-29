import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function RespaldoInternoPage({
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

  const medidas = (visita.medidas ?? {}) as Record<string, string>;
  const fecha = new Date(visita.fecha).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-dvh bg-white text-black">
      <PrintButton />
      <div className="max-w-2xl mx-auto px-8 py-10 print:px-0 print:py-0">
        <h1 className="font-bold text-xl mb-1">SERVICIOS ELÉCTRICOS LÓPEZ</h1>
        <p className="text-sm text-gray-500 mb-6">
          Respaldo interno de visita — no es el informe para el cliente
        </p>
        <p className="text-sm text-gray-500 mb-6">{fecha}</p>

        <Fila label="Cliente" value={cliente?.nombre} />
        {visita.referido_por && (
          <Fila label="Referido por" value={visita.referido_por} />
        )}
        <Fila label="Dirección" value={cliente?.direccion} />
        <Fila label="Tipo de trabajo" value={visita.tipo_trabajo} />
        <Fila label="Estado" value={visita.estado_seguimiento} />
        {visita.etiquetas?.length > 0 && (
          <Fila label="Etiquetas" value={visita.etiquetas.join(", ")} />
        )}
        {Object.keys(medidas).length > 0 && (
          <Fila
            label="Medidas"
            value={Object.entries(medidas)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          />
        )}
        {visita.notas_voz_transcripcion && (
          <Fila
            label="Descripción de la actividad"
            value={visita.notas_voz_transcripcion}
          />
        )}
        {visita.notas_cliente && (
          <Fila label="Notas personales del cliente" value={visita.notas_cliente} />
        )}
        {visita.equipos_utilizados && (
          <Fila label="Equipos utilizados" value={visita.equipos_utilizados} />
        )}
        {visita.carpeta_fotos_drive_url && (
          <Fila label="Carpeta de fotos (Drive)" value={visita.carpeta_fotos_drive_url} />
        )}
        {visita.costo_equipos > 0 && (
          <Fila
            label="Costo equipos"
            value={`$${Number(visita.costo_equipos).toLocaleString("es-CL")}`}
          />
        )}
        {visita.total_estimado > 0 && (
          <Fila
            label="Total estimado"
            value={`$${Number(visita.total_estimado).toLocaleString("es-CL")}`}
          />
        )}
        {visita.km_recorridos > 0 && (
          <Fila label="Km recorridos" value={String(visita.km_recorridos)} />
        )}

        <p className="text-xs text-gray-400 mt-10">
          Generado por SEL Control — {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
}

function Fila({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
