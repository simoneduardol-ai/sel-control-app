import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generarPdfDiagnostico } from "@/lib/google/pdfDiagnostico";
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

  const { data: diag } = await supabase
    .from("diagnosticos_electricos")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!diag) {
    return NextResponse.json({ error: "Diagnóstico no encontrado" }, { status: 404 });
  }

  const cliente = diag.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  const pdfBuffer = await generarPdfDiagnostico({
    clienteNombre: cliente?.nombre ?? "Cliente sin nombre",
    clienteDireccion: cliente?.direccion,
    tecnico: diag.tecnico,
    fechaHora: diag.fecha_hora,
    circuitoAfectado: diag.circuito_afectado,
    automaticoAmperaje: diag.automatico_amperaje,
    diferencialMa: diag.diferencial_ma,
    notasCircuito: diag.notas_circuito,
    sintomas: diag.sintomas ?? [],
    observacionesSintomas: diag.observaciones_sintomas,
    rcdLugarPrueba: diag.rcd_lugar_prueba,
    rcdCorrienteMa: diag.rcd_corriente_ma,
    rcdAngulo0Ms: diag.rcd_angulo0_ms,
    rcdAngulo0Resultado: diag.rcd_angulo0_resultado,
    rcdAngulo180Ms: diag.rcd_angulo180_ms,
    rcdAngulo180Resultado: diag.rcd_angulo180_resultado,
    rcdConclusion: diag.rcd_conclusion,
    meggerFaseTierraMohm: diag.megger_fase_tierra_mohm,
    meggerFaseTierraResultado: diag.megger_fase_tierra_resultado,
    meggerNeutroTierraMohm: diag.megger_neutro_tierra_mohm,
    meggerNeutroTierraResultado: diag.megger_neutro_tierra_resultado,
    meggerFaseNeutroMohm: diag.megger_fase_neutro_mohm,
    meggerFaseNeutroResultado: diag.megger_fase_neutro_resultado,
    continuidadOhm: diag.continuidad_ohm,
    continuidadResultado: diag.continuidad_resultado,
    diagnosticoUbicacion: diag.diagnostico_ubicacion,
    diagnosticoCausas: diag.diagnostico_causas ?? [],
    trabajoRealizado: diag.trabajo_realizado,
    materialesUsados: diag.materiales_usados,
    manoObraCosto: diag.mano_obra_costo,
    tieneFoto: !!diag.foto_evidencia_url,
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
      const fechaSlug = new Date(diag.fecha_hora).toISOString().slice(0, 10);
      const { url } = await subirArchivoACarpetaCliente({
        refreshToken: integracion.refresh_token,
        nombreCliente: cliente?.nombre ?? "Sin nombre",
        subcarpeta: "Diagnósticos",
        nombreArchivo: `Diagnostico - ${fechaSlug}.pdf`,
        contenido: pdfBuffer,
        mimeType: "application/pdf",
      });
      driveUrl = url;
    } catch {
      // si Drive falla, igual devolvemos el PDF para descarga directa
    }
  }

  await supabase
    .from("diagnosticos_electricos")
    .update({ pdf_url: driveUrl })
    .eq("id", id);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="diagnostico.pdf"`,
      "X-Drive-Url": driveUrl ?? "",
    },
  });
}
