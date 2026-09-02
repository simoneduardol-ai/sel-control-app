import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generarPdfInspeccion } from "@/lib/google/pdfInspeccion";
import { subirArchivoACarpetaCliente } from "@/lib/google/drive";

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

  const { data: inspeccion } = await supabase
    .from("inspecciones_electricas")
    .select("*, clientes(nombre)")
    .eq("id", id)
    .single();

  if (!inspeccion) {
    return NextResponse.json({ error: "Inspección no encontrada" }, { status: 404 });
  }

  const cliente = inspeccion.clientes as unknown as { nombre: string } | null;
  const nombreCliente = cliente?.nombre ?? "Sin nombre";

  let numeroOt = inspeccion.numero_ot as string | null;
  if (!numeroOt) {
    const anio = new Date().getFullYear();
    const { count } = await supabase
      .from("inspecciones_electricas")
      .select("id", { count: "exact", head: true })
      .like("numero_ot", `OT-${anio}-%`);
    const siguiente = (count ?? 0) + 1;
    numeroOt = `OT-${anio}-${String(siguiente).padStart(3, "0")}`;
    await supabase
      .from("inspecciones_electricas")
      .update({ numero_ot: numeroOt })
      .eq("id", id);
  }

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

  // Firmar las urls de las fotos (bucket privado)
  const fotosFirmadas: string[] = [];
  for (const path of inspeccion.fotos_urls ?? []) {
    const { data } = await supabase.storage
      .from("inspecciones-media")
      .createSignedUrl(path, 600);
    if (data?.signedUrl) fotosFirmadas.push(data.signedUrl);
  }

  const pdfBuffer = await generarPdfInspeccion({
    numeroOt,
    cliente: nombreCliente,
    logoUrl: `${process.env.APP_URL}/logo-dark.jpg`,
    fecha: inspeccion.fecha_visita
      ? new Date(inspeccion.fecha_visita + "T00:00:00").toLocaleDateString("es-CL", {
          dateStyle: "long",
        })
      : new Date().toLocaleDateString("es-CL", { dateStyle: "long" }),
    datos: inspeccion,
    diferenciales: diferenciales ?? [],
    aislaciones: aislaciones ?? [],
    fotosUrls: fotosFirmadas,
  });

  let driveUrl: string | null = null;

  const { data: integracion } = await supabase
    .from("integraciones_google")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (integracion) {
    try {
      const { url } = await subirArchivoACarpetaCliente({
        refreshToken: integracion.refresh_token,
        carpetaRaiz: "Bitácora - Clientes (SEL)",
        nombreCliente,
        subcarpeta: "Inspecciones",
        nombreArchivo: `${numeroOt}.pdf`,
        contenido: pdfBuffer,
        mimeType: "application/pdf",
      });
      driveUrl = url;
      await supabase
        .from("inspecciones_electricas")
        .update({ pdf_drive_url: driveUrl })
        .eq("id", id);
    } catch {
      // si Drive falla, igual devolvemos el PDF para descarga directa
    }
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${numeroOt}.pdf"`,
      "X-Drive-Url": driveUrl ?? "",
    },
  });
}
