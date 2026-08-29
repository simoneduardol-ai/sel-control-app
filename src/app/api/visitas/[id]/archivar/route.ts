import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generarPdfRespaldoInterno } from "@/lib/google/pdf";
import { subirPdfACarpetaCliente } from "@/lib/google/drive";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: integracion } = await supabase
    .from("integraciones_google")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (!integracion) {
    // Google Drive no está conectado — no es un error, simplemente no se archiva.
    return NextResponse.json({ archivado: false, motivo: "drive_no_conectado" });
  }

  const { data: visita } = await supabase
    .from("visitas_terreno")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!visita) {
    return NextResponse.json({ error: "Visita no encontrada" }, { status: 404 });
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

    await supabase
      .from("visitas_terreno")
      .update({ pdf_drive_url: url })
      .eq("id", id);

    return NextResponse.json({ archivado: true, url });
  } catch (err) {
    return NextResponse.json(
      { archivado: false, motivo: "error_drive", detalle: String(err) },
      { status: 500 }
    );
  }
}
