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

  // Asignar número correlativo la primera vez que se emite (COT-2026-001)
  let numeroCotizacion = cotizacion.numero_cotizacion as string | null;
  if (!numeroCotizacion) {
    const anio = new Date().getFullYear();
    const { count } = await supabase
      .from("cotizaciones")
      .select("id", { count: "exact", head: true })
      .like("numero_cotizacion", `COT-${anio}-%`);

    const siguiente = (count ?? 0) + 1;
    numeroCotizacion = `COT-${anio}-${String(siguiente).padStart(3, "0")}`;

    await supabase
      .from("cotizaciones")
      .update({ numero_cotizacion: numeroCotizacion })
      .eq("id", id);
  }

  const { data: etapas } = await supabase
    .from("cotizacion_etapas")
    .select("nombre_etapa, orden, cotizacion_items_apu(descripcion_item, cantidad, unidad, costo_material_unitario, costo_mano_obra_unitario, costo_equipo_unitario, mostrar_precio_individual)")
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
        costo_equipo_unitario: number;
        mostrar_precio_individual: boolean;
      }) => ({
        descripcion: i.descripcion_item,
        cantidad: i.cantidad,
        unidad: i.unidad,
        mostrarPrecioIndividual: i.mostrar_precio_individual,
        precioUnitario:
          i.costo_material_unitario + i.costo_mano_obra_unitario + i.costo_equipo_unitario,
        total:
          i.cantidad *
          (i.costo_material_unitario + i.costo_mano_obra_unitario + i.costo_equipo_unitario),
      })
    ),
  }));

  const pdfBuffer = await generarPdfCotizacion({
    numeroCotizacion,
    cliente: cliente?.nombre ?? "Cliente sin nombre",
    direccion: cliente?.direccion,
    etapas: etapasPdf,
    totalMateriales: Number(cotizacion.total_materiales) || 0,
    totalManoObra: Number(cotizacion.total_mano_obra) || 0,
    totalEquipos: Number(cotizacion.total_equipos) || 0,
    mostrarPrecioPorItem: cotizacion.mostrar_precio_por_item,
    mostrarTotalMateriales: cotizacion.mostrar_total_materiales,
    conIva: cotizacion.con_iva,
    fecha: new Date().toLocaleDateString("es-CL", { dateStyle: "long" }),
    logoUrl: `${process.env.APP_URL}/logo-dark.jpg`,
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
        nombreArchivo: `${numeroCotizacion}.pdf`,
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
