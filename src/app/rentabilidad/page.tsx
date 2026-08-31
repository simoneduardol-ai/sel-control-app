import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import RentabilidadDashboard, { type ObraRentabilidad } from "@/components/RentabilidadDashboard";

export const dynamic = "force-dynamic";

const IVA = 1.19;

export default async function RentabilidadPage() {
  const supabase = await createClient();

  const { data: obras } = await supabase
    .from("obras_ejecucion")
    .select(
      `id, estado, avance_porcentaje, monto_cotizado, created_at,
       clientes(nombre),
       cotizaciones(numero_cotizacion, total_materiales, total_mano_obra, total_equipos)`
    )
    .order("created_at", { ascending: false });

  const { data: pagos } = await supabase.from("pagos_obra").select("obra_id, monto");

  const abonadoPorObra = new Map<string, number>();
  (pagos ?? []).forEach((p) => {
    abonadoPorObra.set(
      p.obra_id,
      (abonadoPorObra.get(p.obra_id) ?? 0) + Number(p.monto)
    );
  });

  const datos: ObraRentabilidad[] = (obras ?? []).map((o) => {
    const cliente = o.clientes as unknown as { nombre: string } | null;
    const cot = o.cotizaciones as unknown as {
      numero_cotizacion: string | null;
      total_materiales: number;
      total_mano_obra: number;
      total_equipos: number;
    } | null;

    const cotizadoConIva = Number(o.monto_cotizado || 0) * IVA;
    const materialesConIva = Number(cot?.total_materiales || 0) * IVA;
    const manoObra = Number(cot?.total_mano_obra || 0);
    const equiposConIva = Number(cot?.total_equipos || 0) * IVA;
    const costoTotalReal = materialesConIva + manoObra + equiposConIva;
    const utilidadBruta = cotizadoConIva - costoTotalReal;
    const pctRentabilidad = cotizadoConIva > 0 ? (utilidadBruta / cotizadoConIva) * 100 : 0;
    const margenNeto = costoTotalReal > 0 ? (utilidadBruta / costoTotalReal) * 100 : 0;
    const abonado = abonadoPorObra.get(o.id) ?? 0;

    return {
      id: o.id,
      cliente: cliente?.nombre ?? "Sin nombre",
      numeroCotizacion: cot?.numero_cotizacion ?? null,
      estado: o.estado,
      createdAt: o.created_at,
      cotizadoConIva,
      materialesConIva,
      manoObra,
      equiposConIva,
      costoTotalReal,
      utilidadBruta,
      pctRentabilidad,
      margenNeto,
      abonado,
      saldoPorCobrar: cotizadoConIva - abonado,
    };
  });

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 px-5 md:px-8 py-8 max-w-6xl pb-24">
        <h1 className="font-display text-2xl mb-1">Rentabilidad</h1>
        <p className="text-text-dim text-sm mb-6">
          Cotizado vs. costo real por obra — actualizado en vivo
        </p>
        <RentabilidadDashboard datos={datos} />
      </main>
    </div>
  );
}
