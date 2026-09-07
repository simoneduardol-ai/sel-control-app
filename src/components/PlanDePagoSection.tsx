"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Check } from "lucide-react";

type Cuota = { rowId: string; etiqueta: string; monto: string };

function etiquetaPorIndice(i: number) {
  return i === 0 ? "Adelanto" : `Pago ${i + 1}`;
}

export default function PlanDePagoSection({
  cotizacionId,
  total,
}: {
  cotizacionId: string;
  total: number;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [tipo, setTipo] = useState<"contado" | "partes">("contado");
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: cot } = await supabase
        .from("cotizaciones")
        .select("forma_pago_plan")
        .eq("id", cotizacionId)
        .single();
      if (cot) setTipo(cot.forma_pago_plan as "contado" | "partes");

      const { data: cuotasData } = await supabase
        .from("cotizacion_cuotas")
        .select("*")
        .eq("cotizacion_id", cotizacionId)
        .eq("es_saldo_final", false)
        .order("orden");

      if (cuotasData) {
        setCuotas(
          cuotasData.map((c) => ({
            rowId: crypto.randomUUID(),
            etiqueta: c.etiqueta,
            monto: String(c.monto),
          }))
        );
      }
      setCargando(false);
    })();
  }, [cotizacionId]);

  const sumaCuotas = cuotas.reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const seExcede = sumaCuotas > total;
  const pagoFinal = Math.max(0, total - sumaCuotas);

  function agregarCuota() {
    setCuotas((prev) => [...prev, { rowId: crypto.randomUUID(), etiqueta: "", monto: "" }]);
  }

  function quitarCuota(rowId: string) {
    setCuotas((prev) => prev.filter((c) => c.rowId !== rowId));
  }

  function actualizarMonto(rowId: string, monto: string) {
    setCuotas((prev) => prev.map((c) => (c.rowId === rowId ? { ...c, monto } : c)));
  }

  async function guardar() {
    setGuardando(true);

    await supabase
      .from("cotizaciones")
      .update({ forma_pago_plan: tipo })
      .eq("id", cotizacionId);

    await supabase.from("cotizacion_cuotas").delete().eq("cotizacion_id", cotizacionId);

    if (tipo === "partes") {
      const filas = cuotas.map((c, i) => ({
        cotizacion_id: cotizacionId,
        orden: i,
        etiqueta: etiquetaPorIndice(i),
        monto: Number(c.monto) || 0,
        es_saldo_final: false,
      }));
      filas.push({
        cotizacion_id: cotizacionId,
        orden: cuotas.length,
        etiqueta: "Pago final",
        monto: pagoFinal,
        es_saldo_final: true,
      });
      await supabase.from("cotizacion_cuotas").insert(filas);
    }

    setGuardando(false);
    setGuardado(true);
    router.refresh();
    setTimeout(() => setGuardado(false), 2000);
  }

  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

  if (cargando) return null;

  return (
    <section>
      <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
        Plan de pago
      </h2>
      <div className="border border-border rounded-xl bg-surface p-4 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTipo("contado")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tipo === "contado"
                ? "bg-accent text-accent-text"
                : "border border-border text-text-dim"
            }`}
          >
            Pago de contado
          </button>
          <button
            onClick={() => setTipo("partes")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tipo === "partes"
                ? "bg-accent text-accent-text"
                : "border border-border text-text-dim"
            }`}
          >
            Pago en partes
          </button>
        </div>

        {tipo === "partes" && (
          <div className="space-y-2">
            {cuotas.map((c, i) => (
              <div key={c.rowId} className="flex items-center gap-2">
                <span className="text-sm w-24 shrink-0">{etiquetaPorIndice(i)}</span>
                <input
                  type="number"
                  value={c.monto}
                  onChange={(e) => actualizarMonto(c.rowId, e.target.value)}
                  placeholder="Monto"
                  className="flex-1 rounded-lg bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button onClick={() => quitarCuota(c.rowId)} className="text-text-dim p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <button
              onClick={agregarCuota}
              className="flex items-center gap-1.5 text-accent text-sm font-medium"
            >
              <Plus size={15} /> Agregar pago
            </button>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-medium">Pago final</span>
              <span
                className={`font-display text-base ${seExcede ? "text-danger" : ""}`}
              >
                {fmt(pagoFinal)}
              </span>
            </div>
            {seExcede ? (
              <p className="text-danger text-xs font-medium">
                Los pagos que agregaste suman {fmt(sumaCuotas)}, {fmt(sumaCuotas - total)}{" "}
                más que el total ({fmt(total)}). Ajusta algún monto antes de guardar.
              </p>
            ) : (
              <p className="text-text-dim text-xs">
                Se calcula solo: Total ({fmt(total)}) menos lo que vayas agregando arriba.
              </p>
            )}
          </div>
        )}

        <button
          onClick={guardar}
          disabled={guardando || (tipo === "partes" && seExcede)}
          className="w-full rounded-xl bg-accent text-accent-text font-semibold py-2.5 text-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {guardado ? <Check size={16} /> : null}
          {guardando
            ? "Guardando..."
            : guardado
            ? "Guardado"
            : tipo === "partes" && seExcede
            ? "Corrige los montos para guardar"
            : "Guardar plan de pago"}
        </button>
      </div>
    </section>
  );
}
