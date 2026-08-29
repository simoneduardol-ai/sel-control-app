import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function MaterialesPage() {
  const supabase = await createClient();
  const { data: materiales } = await supabase
    .from("materiales_maestros")
    .select("*")
    .order("categoria")
    .order("nombre");

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-4xl">
        <h1 className="font-display text-2xl mb-1">Materiales</h1>
        <p className="text-text-dim text-sm mb-6">
          {materiales?.length ?? 0} materiales en el catálogo
        </p>

        <div className="border border-border rounded-xl overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wide">
                <th className="text-left font-medium px-4 py-3">Material</th>
                <th className="text-left font-medium px-4 py-3">Categoría</th>
                <th className="text-left font-medium px-4 py-3">Unidad</th>
                <th className="text-right font-medium px-4 py-3">
                  Costo referencial
                </th>
              </tr>
            </thead>
            <tbody>
              {(materiales ?? []).map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-surface-raised transition"
                >
                  <td className="px-4 py-3 font-medium">{m.nombre}</td>
                  <td className="px-4 py-3 text-text-dim">
                    {m.categoria ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-dim">{m.unidad}</td>
                  <td className="px-4 py-3 text-right">
                    ${Number(m.costo_referencial).toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!materiales || materiales.length === 0) && (
            <p className="text-text-dim text-sm text-center py-10">
              Aún no tienes materiales cargados en el catálogo.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
