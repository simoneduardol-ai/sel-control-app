import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subirArchivoACarpetaCliente } from "@/lib/google/drive";
import { archivarVisitaEnDrive } from "@/lib/google/archivarVisita";

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
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

  const cambios = await request.json();

  const { data: visitaActual } = await supabase
    .from("visitas_terreno")
    .select("*, clientes(nombre)")
    .eq("id", id)
    .single();

  if (!visitaActual) {
    return NextResponse.json({ error: "Visita no encontrada" }, { status: 404 });
  }

  const cliente = visitaActual.clientes as unknown as { nombre: string } | null;
  const nombreCliente = cliente?.nombre ?? "Sin nombre";

  const { count } = await supabase
    .from("visitas_historial")
    .select("id", { count: "exact", head: true })
    .eq("visita_id", id);

  const numeroVersion = count ?? 0;
  const etiquetaVersion = numeroVersion === 0 ? "original" : `mod${numeroVersion}`;

  const fechaSlug = new Date(visitaActual.fecha).toISOString().slice(0, 10).replace(/-/g, "");
  const nombreArchivo = `visita-${slug(nombreCliente)}-${fechaSlug}-${etiquetaVersion}.json`;

  let driveUrl: string | null = null;

  const { data: integracion } = await supabase
    .from("integraciones_google")
    .select("refresh_token")
    .eq("user_id", user.id)
    .single();

  if (integracion) {
    try {
      const datosSinCliente = { ...visitaActual } as Record<string, unknown>;
      delete datosSinCliente.clientes;
      const { url } = await subirArchivoACarpetaCliente({
        refreshToken: integracion.refresh_token,
        nombreCliente,
        subcarpeta: "Versiones",
        nombreArchivo,
        contenido: JSON.stringify(datosSinCliente, null, 2),
        mimeType: "application/json",
      });
      driveUrl = url;
    } catch {
      // si Drive falla, igual seguimos — el respaldo queda registrado sin link
    }
  }

  await supabase.from("visitas_historial").insert({
    visita_id: id,
    etiqueta_version: etiquetaVersion,
    drive_url: driveUrl,
  });

  const { error: errUpdate } = await supabase
    .from("visitas_terreno")
    .update(cambios)
    .eq("id", id);

  if (errUpdate) {
    return NextResponse.json({ error: errUpdate.message }, { status: 500 });
  }

  // Re-archiva el/los PDF con los datos ya actualizados, para que Drive
  // siempre tenga la versión vigente, no la de antes de este cambio.
  // Se llama directo (no por fetch a sí misma) — más rápido y no puede
  // fallar en silencio por un problema de red.
  try {
    await archivarVisitaEnDrive(supabase, id, user.id);
  } catch {
    // si falla el re-archivado, el cambio ya quedó guardado igual
  }

  return NextResponse.json({ ok: true, driveUrl });
}
