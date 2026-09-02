import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subirArchivoACarpetaCliente } from "@/lib/google/drive";

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

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

  const { principal, diferenciales, aislaciones } = await request.json();

  const { data: inspeccionActual } = await supabase
    .from("inspecciones_electricas")
    .select("*, clientes(nombre)")
    .eq("id", id)
    .single();

  if (!inspeccionActual) {
    return NextResponse.json({ error: "Inspección no encontrada" }, { status: 404 });
  }

  const { data: difActuales } = await supabase
    .from("inspeccion_diferenciales")
    .select("*")
    .eq("inspeccion_id", id);
  const { data: aislActuales } = await supabase
    .from("inspeccion_aislaciones")
    .select("*")
    .eq("inspeccion_id", id);

  const cliente = inspeccionActual.clientes as unknown as { nombre: string } | null;
  const nombreCliente = cliente?.nombre ?? "Sin nombre";

  const { count } = await supabase
    .from("inspecciones_historial")
    .select("id", { count: "exact", head: true })
    .eq("inspeccion_id", id);

  const numeroVersion = count ?? 0;
  const etiquetaVersion = numeroVersion === 0 ? "original" : `mod${numeroVersion}`;

  const fechaSlug = inspeccionActual.fecha_visita
    ? inspeccionActual.fecha_visita.replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const nombreArchivo = `inspeccion-${slug(nombreCliente)}-${fechaSlug}-${etiquetaVersion}.json`;

  let driveUrl: string | null = null;

  const { data: integracion } = await supabase
    .from("integraciones_google")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (integracion) {
    try {
      const snapshotBase = { ...inspeccionActual } as Record<string, unknown>;
      delete snapshotBase.clientes;
      const snapshot = {
        ...snapshotBase,
        diferenciales: difActuales ?? [],
        aislaciones: aislActuales ?? [],
      };
      const { url } = await subirArchivoACarpetaCliente({
        refreshToken: integracion.refresh_token,
        carpetaRaiz: "Bitácora - Clientes (SEL)",
        nombreCliente,
        subcarpeta: "Inspecciones/Versiones",
        nombreArchivo,
        contenido: JSON.stringify(snapshot, null, 2),
        mimeType: "application/json",
      });
      driveUrl = url;
    } catch {
      // si Drive falla, igual seguimos — el respaldo queda registrado sin link
    }
  }

  await supabase.from("inspecciones_historial").insert({
    inspeccion_id: id,
    etiqueta_version: etiquetaVersion,
    drive_url: driveUrl,
  });

  const { error: errUpdate } = await supabase
    .from("inspecciones_electricas")
    .update(principal)
    .eq("id", id);
  if (errUpdate) {
    return NextResponse.json({ error: errUpdate.message }, { status: 500 });
  }

  await supabase.from("inspeccion_diferenciales").delete().eq("inspeccion_id", id);
  await supabase.from("inspeccion_aislaciones").delete().eq("inspeccion_id", id);

  if (diferenciales?.length > 0) {
    await supabase
      .from("inspeccion_diferenciales")
      .insert(diferenciales.map((d: object, i: number) => ({ ...d, inspeccion_id: id, orden: i })));
  }
  if (aislaciones?.length > 0) {
    await supabase
      .from("inspeccion_aislaciones")
      .insert(aislaciones.map((a: object, i: number) => ({ ...a, inspeccion_id: id, orden: i })));
  }

  return NextResponse.json({ ok: true, driveUrl });
}
