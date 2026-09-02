import type { SupabaseClient } from "@supabase/supabase-js";
import { generarPdfRespaldoInterno, generarPdfInformeCliente } from "@/lib/google/pdf";
import { subirPdfACarpetaCliente, subirArchivoACarpetaCliente } from "@/lib/google/drive";
import { logoComoDataUri } from "@/lib/google/logo";

/**
 * Genera y archiva en Drive el respaldo interno (y el informe cliente, si
 * corresponde) de una visita. Se llama directo desde código del servidor
 * (no por HTTP) para evitar que el servidor tenga que "llamarse a sí mismo"
 * por su URL pública — ese patrón es frágil (puede fallar en silencio,
 * como pasó con el logo).
 */
export async function archivarVisitaEnDrive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  visitaId: string,
  userId: string
) {
  const { data: integracion } = await supabase
    .from("integraciones_google")
    .select("refresh_token")
    .eq("user_id", userId)
    .single();

  if (!integracion) {
    return { archivado: false, motivo: "drive_no_conectado" as const };
  }

  const { data: visita } = await supabase
    .from("visitas_terreno")
    .select("*, clientes(nombre, direccion)")
    .eq("id", visitaId)
    .single();

  if (!visita) {
    return { archivado: false, motivo: "visita_no_encontrada" as const };
  }

  const cliente = visita.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  const fecha = new Date(visita.fecha);
  const fechaTexto = fecha.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const pdfBuffer = await generarPdfRespaldoInterno({
    cliente: cliente?.nombre ?? "Cliente sin nombre",
    direccion: cliente?.direccion,
    referidoPor: visita.referido_por,
    tipoTrabajo: visita.tipo_trabajo,
    estado: visita.estado_seguimiento,
    etiquetas: visita.etiquetas,
    medidas: visita.medidas,
    descripcion: visita.notas_voz_transcripcion,
    notasCliente: visita.notas_cliente,
    equipos: visita.equipos_utilizados,
    costoEquipos: Number(visita.costo_equipos) || undefined,
    totalEstimado: Number(visita.total_estimado) || undefined,
    kmRecorridos: Number(visita.km_recorridos) || undefined,
    fecha: fechaTexto,
  });

  const nombreArchivo = `${fecha.toISOString().slice(0, 16).replace(/[T:]/g, "_")} - ${
    visita.tipo_trabajo || "Visita"
  }.pdf`;

  try {
    const { url } = await subirPdfACarpetaCliente({
      refreshToken: integracion.refresh_token,
      nombreCliente: cliente?.nombre ?? "Sin nombre",
      nombreArchivo,
      pdfBuffer,
    });

    await supabase.from("visitas_terreno").update({ pdf_drive_url: url }).eq("id", visitaId);

    let urlInforme: string | null = null;
    if (visita.requiere_informe_cliente) {
      const fotoUrlsFirmadas: string[] = [];
      for (const path of (visita.fotos ?? []).slice(0, 6)) {
        const { data } = await supabase.storage
          .from("visitas-media")
          .createSignedUrl(path, 600);
        if (data?.signedUrl) fotoUrlsFirmadas.push(data.signedUrl);
      }

      const pdfInforme = await generarPdfInformeCliente({
        cliente: cliente?.nombre ?? "Cliente sin nombre",
        direccion: cliente?.direccion,
        tipoTrabajo: visita.tipo_trabajo,
        fecha: fecha.toLocaleDateString("es-CL", { dateStyle: "long" }),
        hallazgos: visita.notas_voz_transcripcion,
        fotosUrls: fotoUrlsFirmadas,
        totalEstimado: visita.total_estimado,
        logoUrl: logoComoDataUri("logo-dark.jpg"),
      });

      const { url: urlInf } = await subirArchivoACarpetaCliente({
        refreshToken: integracion.refresh_token,
        nombreCliente: cliente?.nombre ?? "Sin nombre",
        subcarpeta: "Informes cliente",
        nombreArchivo: `Informe - ${nombreArchivo}`,
        contenido: pdfInforme,
        mimeType: "application/pdf",
      });
      urlInforme = urlInf;

      await supabase
        .from("visitas_terreno")
        .update({ pdf_informe_drive_url: urlInforme })
        .eq("id", visitaId);
    }

    return { archivado: true as const, url, urlInforme };
  } catch (err) {
    return { archivado: false as const, motivo: "error_drive" as const, detalle: String(err) };
  }
}
