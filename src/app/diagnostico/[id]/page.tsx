import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import EmitirDiagnosticoPdfButton from "@/components/EmitirDiagnosticoPdfButton";

export const dynamic = "force-dynamic";

export default async function DiagnosticoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: diag } = await supabase
    .from("diagnosticos_electricos")
    .select("*, clientes(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!diag) notFound();

  const cliente = diag.clientes as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  let fotoUrl: string | null = null;
  if (diag.foto_evidencia_url) {
    const { data } = await supabase.storage
      .from("diagnosticos-media")
      .createSignedUrl(diag.foto_evidencia_url, 3600);
    fotoUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1 text-text-dim">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-display text-lg">{cliente?.nombre}</h1>
        </header>

        <div className="px-5 md:px-8 py-5 max-w-2xl space-y-6">
          <p className="text-text-dim text-sm">
            {new Date(diag.fecha_hora).toLocaleString("es-CL", {
              dateStyle: "long",
              timeStyle: "short",
            })}
            {diag.tecnico && ` · ${diag.tecnico}`}
          </p>

          <EmitirDiagnosticoPdfButton diagnosticoId={diag.id} />

          {diag.circuito_afectado && (
            <div className="bg-surface border border-border rounded-xl p-4 text-sm">
              <p>
                <strong>Circuito:</strong> {diag.circuito_afectado}
              </p>
              {diag.automatico_amperaje && (
                <p>
                  <strong>Automático:</strong> {diag.automatico_amperaje} A
                </p>
              )}
              {diag.diferencial_ma && (
                <p>
                  <strong>Diferencial:</strong> {diag.diferencial_ma} mA
                </p>
              )}
            </div>
          )}

          {(diag.diagnostico_ubicacion || (diag.diagnostico_causas ?? []).length > 0) && (
            <div>
              <h2 className="text-sm font-medium text-text-dim mb-2">Diagnóstico</h2>
              {diag.diagnostico_ubicacion && (
                <p className="text-sm mb-2">{diag.diagnostico_ubicacion}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {(diag.diagnostico_causas ?? []).map((c: string) => (
                  <span
                    key={c}
                    className="text-xs bg-danger/10 text-danger rounded-full px-2.5 py-1"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {diag.trabajo_realizado && (
            <div>
              <h2 className="text-sm font-medium text-text-dim mb-2">Trabajo realizado</h2>
              <p className="text-sm bg-surface border border-border rounded-xl p-4">
                {diag.trabajo_realizado}
              </p>
            </div>
          )}

          {fotoUrl && (
            <div>
              <h2 className="text-sm font-medium text-text-dim mb-2">Evidencia</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoUrl} alt="Evidencia UT526" className="w-full rounded-xl border border-border" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
