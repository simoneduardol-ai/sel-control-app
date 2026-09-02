import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { archivarVisitaEnDrive } from "@/lib/google/archivarVisita";

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

  const resultado = await archivarVisitaEnDrive(supabase, id, user.id);

  if (!resultado.archivado && resultado.motivo === "error_drive") {
    return NextResponse.json(resultado, { status: 500 });
  }

  return NextResponse.json(resultado);
}
