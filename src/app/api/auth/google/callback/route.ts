import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google/drive";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // user_id
  const appUrl = process.env.APP_URL!;

  if (!code || !state) {
    return NextResponse.redirect(new URL("/ajustes?error=1", appUrl));
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      // Google no siempre devuelve un refresh_token nuevo si ya se había
      // autorizado antes; en ese caso pedimos reintentar (prompt=consent
      // ya fuerza esto en el 99% de los casos).
      return NextResponse.redirect(
        new URL("/ajustes?error=sin_refresh_token", appUrl)
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("integraciones_google").upsert(
      {
        user_id: state,
        refresh_token: tokens.refresh_token,
        conectado_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.redirect(new URL("/ajustes?error=guardado", appUrl));
    }

    return NextResponse.redirect(new URL("/ajustes?conectado=1", appUrl));
  } catch {
    return NextResponse.redirect(new URL("/ajustes?error=1", appUrl));
  }
}
