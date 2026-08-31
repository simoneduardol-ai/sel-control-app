import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generarPdfCotizacion } from "@/lib/google/pdfCotizacion";
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

  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!cotizacion) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  const cliente = cotizacion.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  const { data: etapas } = await supabase
    .from("cotizacion_etapas")
    .select("nombre_etapa, orden, cotizacion_items_apu(descripcion_item, cantidad, unidad, costo_material_unitario, costo_mano_obra_unitario)")
    .eq("cotizacion_id", id)
    .order("orden");

  const etapasPdf = (etapas ?? []).map((e) => ({
    nombre: e.nombre_etapa,
    items: (e.cotizacion_items_apu ?? []).map(
      (i: {
        descripcion_item: string;
        cantidad: number;
        unidad: string;
        costo_material_unitario: number;
        costo_mano_obra_unitario: number;
      }) => ({
        descripcion: i.descripcion_item,
        cantidad: i.cantidad,
        unidad: i.unidad,
        precioUnitario: i.costo_material_unitario + i.costo_mano_obra_unitario,
        total: i.cantidad * (i.costo_material_unitario + i.costo_mano_obra_unitario),
      })
    ),
  }));

  const pdfBuffer = await generarPdfCotizacion({
    cliente: cliente?.nombre ?? "Cliente sin nombre",
    direccion: cliente?.direccion,
    etapas: etapasPdf,
    totalMateriales: Number(cotizacion.total_materiales) || 0,
    totalManoObra: Number(cotizacion.total_mano_obra) || 0,
    totalEquipos: Number(cotizacion.total_equipos) || 0,
    mostrarPrecioPorItem: cotizacion.mostrar_precio_por_item,
    mostrarTotalMateriales: cotizacion.mostrar_total_materiales,
    fecha: new Date().toLocaleDateString("es-CL", { dateStyle: "long" }),
  });

  let driveUrl: string | null = null;

  const { data: integracion } = await supabase
    .from("integraciones_google")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (integracion) {
    try {
      const { url } = await subirPdfACarpetaCliente({
        refreshToken: integracion.refresh_token,
        carpetaRaiz: "Cotizaciones (SEL)",
        nombreCliente: cliente?.nombre ?? "Sin nombre",
        nombreArchivo: `Cotizacion - ${new Date().toISOString().slice(0, 10)}.pdf`,
        pdfBuffer,
      });
      driveUrl = url;
    } catch {
      // si Drive falla, igual devolvemos el PDF para descarga directa
    }
  }

  await supabase
    .from("cotizaciones")
    .update({
      estado: cotizacion.estado === "BORRADOR" ? "ENVIADA" : cotizacion.estado,
      pdf_url: driveUrl,
    })
    .eq("id", id);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cotizacion.pdf"`,
      "X-Drive-Url": driveUrl ?? "",
    },
  });
}
