"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export type ObraRentabilidad = {
  id: string;
  cliente: string;
  numeroCotizacion: string | null;
  estado: string;
  createdAt: string;
  cotizadoConIva: number;
  materialesConIva: number;
  manoObra: number;
  equiposConIva: number;
  costoTotalReal: number;
  utilidadBruta: number;
  pctRentabilidad: number;
  margenNeto: number;
  abonado: number;
  saldoPorCobrar: number;
};

const COLOR_ESTADO: Record<string, string> = {
  EN_CURSO: "#4d9de5",
  PAUSADA: "#f0b400",
  ANULADA: "#e5484d",
  FINALIZADA: "#1a9e6b",
};

function colorSemaforo(pct: number) {
  if (pct >= 30) return "#1a9e6b";
  if (pct >= 15) return "#f0b400";
  return "#e5484d";
}

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default function RentabilidadDashboard({
  datos,
}: {
  datos: ObraRentabilidad[];
}) {
  const [periodo, setPeriodo] = useState<"todo" | "mes" | "anio">("todo");

  const datosFiltrados = useMemo(() => {
    if (periodo === "todo") return datos;
    const ahora = new Date();
    return datos.filter((d) => {
      const fecha = new Date(d.createdAt);
      if (periodo === "anio") return fecha.getFullYear() === ahora.getFullYear();
      return (
        fecha.getFullYear() === ahora.getFullYear() &&
        fecha.getMonth() === ahora.getMonth()
      );
    });
  }, [datos, periodo]);

  const totales = datosFiltrados.reduce(
    (acc, d) => ({
      cotizado: acc.cotizado + d.cotizadoConIva,
      abonado: acc.abonado + d.abonado,
      porCobrar: acc.porCobrar + d.saldoPorCobrar,
      costoMateriales: acc.costoMateriales + d.materialesConIva,
      utilidad: acc.utilidad + d.utilidadBruta,
    }),
    { cotizado: 0, abonado: 0, porCobrar: 0, costoMateriales: 0, utilidad: 0 }
  );

  const datosGrafico = datosFiltrados.map((d) => ({
    nombre: d.cliente.length > 14 ? d.cliente.slice(0, 14) + "…" : d.cliente,
    pct: Number(d.pctRentabilidad.toFixed(1)),
    color: colorSemaforo(d.pctRentabilidad),
  }));

  const conteoEstados = Object.entries(
    datosFiltrados.reduce((acc: Record<string, number>, d) => {
      acc[d.estado] = (acc[d.estado] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([estado, cantidad]) => ({ estado, cantidad }));

  const ranking = [...datosFiltrados].sort(
    (a, b) => b.pctRentabilidad - a.pctRentabilidad
  );

  function exportarCsv() {
    const encabezado = [
      "Cliente",
      "Cotización",
      "Estado",
      "Cotizado",
      "Costo real",
      "Utilidad bruta",
      "% Rentabilidad",
      "Margen neto",
      "Abonado",
      "Saldo por cobrar",
    ];
    const filas = ranking.map((d) => [
      d.cliente,
      d.numeroCotizacion ?? "",
      d.estado,
      Math.round(d.cotizadoConIva),
      Math.round(d.costoTotalReal),
      Math.round(d.utilidadBruta),
      d.pctRentabilidad.toFixed(1),
      d.margenNeto.toFixed(1),
      Math.round(d.abonado),
      Math.round(d.saldoPorCobrar),
    ]);
    const csv = [encabezado, ...filas]
      .map((fila) => fila.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rentabilidad-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          {[
            { key: "todo", label: "Todo" },
            { key: "anio", label: "Este año" },
            { key: "mes", label: "Este mes" },
          ].map((op) => (
            <button
              key={op.key}
              onClick={() => setPeriodo(op.key as typeof periodo)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                periodo === op.key ? "bg-accent text-accent-text" : "text-text-dim"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportarCsv}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium"
        >
          <Download size={15} /> Exportar Excel (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="border border-border rounded-xl bg-surface p-4">
          <p className="text-text-dim text-xs uppercase tracking-wide mb-1">Cotizado</p>
          <p className="font-display text-lg">{fmt(totales.cotizado)}</p>
        </div>
        <div className="border border-border rounded-xl bg-surface p-4">
          <p className="text-text-dim text-xs uppercase tracking-wide mb-1">Cobrado</p>
          <p className="font-display text-lg text-ok">{fmt(totales.abonado)}</p>
        </div>
        <div className="border border-border rounded-xl bg-surface p-4">
          <p className="text-text-dim text-xs uppercase tracking-wide mb-1">Por cobrar</p>
          <p className="font-display text-lg">{fmt(totales.porCobrar)}</p>
        </div>
        <div className="border border-border rounded-xl bg-surface p-4">
          <p className="text-text-dim text-xs uppercase tracking-wide mb-1">
            Costo materiales
          </p>
          <p className="font-display text-lg">{fmt(totales.costoMateriales)}</p>
        </div>
        <div className="border border-border rounded-xl bg-surface p-4">
          <p className="text-text-dim text-xs uppercase tracking-wide mb-1">
            Utilidad total
          </p>
          <p
            className={`font-display text-lg ${
              totales.utilidad < 0 ? "text-danger" : "text-ok"
            }`}
          >
            {fmt(totales.utilidad)}
          </p>
        </div>
      </div>

      {datosFiltrados.length === 0 ? (
        <p className="text-text-dim text-sm text-center py-16">
          Sin obras en este período todavía.
        </p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border rounded-xl bg-surface p-4">
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
                Rentabilidad por obra
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e4e8" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {datosGrafico.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-border rounded-xl bg-surface p-4">
              <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
                Obras por estado
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={conteoEstados}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name} (${entry.value})`}
                  >
                    {conteoEstados.map((e, i) => (
                      <Cell key={i} fill={COLOR_ESTADO[e.estado] ?? "#9aa1b5"} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              Ranking de obras
            </h2>
            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-dim text-xs uppercase tracking-wide">
                    <th className="text-left font-medium px-4 py-3">Cliente</th>
                    <th className="text-left font-medium px-4 py-3">Estado</th>
                    <th className="text-right font-medium px-4 py-3">Cotizado</th>
                    <th className="text-right font-medium px-4 py-3">Costo real</th>
                    <th className="text-right font-medium px-4 py-3">Utilidad</th>
                    <th className="text-right font-medium px-4 py-3">Rentabilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-border last:border-0 hover:bg-surface-raised transition"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/obra/${d.id}`} className="font-medium hover:underline">
                          {d.cliente}
                        </Link>
                        {d.numeroCotizacion && (
                          <span className="text-text-dim text-xs block">
                            {d.numeroCotizacion}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.estado} />
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(d.cotizadoConIva)}</td>
                      <td className="px-4 py-3 text-right">{fmt(d.costoTotalReal)}</td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          d.utilidadBruta < 0 ? "text-danger" : ""
                        }`}
                      >
                        {fmt(d.utilidadBruta)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="inline-flex items-center gap-1.5 font-medium"
                          style={{ color: colorSemaforo(d.pctRentabilidad) }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: colorSemaforo(d.pctRentabilidad) }}
                          />
                          {d.pctRentabilidad.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-text-dim text-xs mt-2">
              Semáforo: verde ≥30% · amarillo 15–30% · rojo &lt;15% o negativo.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
