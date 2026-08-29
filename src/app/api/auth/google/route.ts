import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google/drive";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", process.env.APP_URL));
  }

  const url = getAuthUrl(user.id);
  return NextResponse.redirect(url);
}
