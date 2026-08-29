import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { CheckCircle2, HardDrive } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ conectado?: string; error?: string }>;
}) {
  const { conectado, error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: integracion } = await supabase
    .from("integraciones_google")
    .select("conectado_at")
    .eq("user_id", user?.id ?? "")
    .single();

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-2xl">
        <h1 className="font-display text-2xl mb-1">Ajustes</h1>
        <p className="text-text-dim text-sm mb-6">
          Conexiones e integraciones de SEL Control
        </p>

        {conectado && (
          <div className="mb-4 bg-ok/10 text-ok rounded-xl px-4 py-3 text-sm">
            Google Drive conectado correctamente.
          </div>
        )}
        {error && (
          <div className="mb-4 bg-danger/10 text-danger rounded-xl px-4 py-3 text-sm">
            No se pudo conectar Google Drive. Intenta de nuevo.
          </div>
        )}

        <div className="border border-border rounded-xl bg-surface p-5">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <HardDrive size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium">Google Drive</h2>
              <p className="text-text-dim text-sm mt-0.5">
                Archiva automático el respaldo interno de cada visita en una
                carpeta por cliente dentro de tu Drive.
              </p>

              {integracion ? (
                <div className="flex items-center gap-1.5 text-ok text-sm mt-3">
                  <CheckCircle2 size={16} />
                  Conectado
                </div>
              ) : (
                <a
                  href="/api/auth/google"
                  className="inline-block mt-3 rounded-lg bg-accent text-accent-text font-medium px-4 py-2 text-sm"
                >
                  Conectar Google Drive
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
