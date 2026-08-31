"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, AlertTriangle, FileText } from "lucide-react";

type Pago = {
  id: string;
  monto: number;
  fecha: string;
  metodo: string;
  numero_comprobante: string | null;
  banco_origen: string | null;
  observacion: string | null;
  archivo_soporte_url: string | null;
};

const METODOS = ["Transferencia", "Efectivo", "Cheque", "Otro"];

export default function PagosObraSection({
  obraId,
  montoCotizado,
  obraFinalizada,
}: {
  obraId: string;
  montoCotizado: number;
  obraFinalizada: boolean;
}) {
  const supabase = createClient();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [metodo, setMetodo] = useState("Transferencia");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [bancoOrigen, setBancoOrigen] = useState("");
  const [observacion, setObservacion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const { data } = await supabase
      .from("pagos_obra")
      .select("*")
      .eq("obra_id", obraId)
      .order("fecha", { ascending: false });
    setPagos(data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, [obraId]);

  const totalAbonado = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const saldoPendiente = montoCotizado - totalAbonado;
  const porcentajeCobro =
    montoCotizado > 0 ? Math.min(100, (totalAbonado / montoCotizado) * 100) : 0;

  function limpiarForm() {
    setMonto("");
    setFecha(new Date().toISOString().slice(0, 10));
    setMetodo("Transferencia");
    setNumeroComprobante("");
    setBancoOrigen("");
    setObservacion("");
    setArchivo(null);
    setError(null);
  }

  async function guardarPago() {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    if (!fecha) {
      setError("Ingresa la fecha del pago.");
      return;
    }
    if (metodo === "Transferencia" && !numeroComprobante.trim()) {
      setError("El N° de comprobante es obligatorio para transferencias.");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      let archivoUrl: string | null = null;
      if (archivo) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ext = archivo.name.split(".").pop();
        const path = `${user?.id}/${obraId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("pagos-obra")
          .upload(path, archivo);
        if (upErr) throw upErr;
        archivoUrl = path;
      }

      const { error: insErr } = await supabase.from("pagos_obra").insert({
        obra_id: obraId,
        monto: montoNum,
        fecha,
        metodo,
        numero_comprobante: numeroComprobante.trim() || null,
        banco_origen: bancoOrigen.trim() || null,
        observacion: observacion.trim() || null,
        archivo_soporte_url: archivoUrl,
      });
      if (insErr) throw insErr;

      limpiarForm();
      setMostrarForm(false);
      cargar();
    } catch {
      setError("No se pudo guardar el pago. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function verArchivo(path: string) {
    const { data } = await supabase.storage
      .from("pagos-obra")
      .createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  if (cargando) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-text-dim">Pagos recibidos</h2>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1 text-accent text-sm font-medium"
        >
          <Plus size={15} /> Agregar pago
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-text-dim text-[11px] uppercase tracking-wide">Cotizado</p>
          <p className="font-display text-sm">${montoCotizado.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-text-dim text-[11px] uppercase tracking-wide">Abonado</p>
          <p className="font-display text-sm text-ok">
            ${totalAbonado.toLocaleString("es-CL")}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-text-dim text-[11px] uppercase tracking-wide">Saldo</p>
          <p
            className={`font-display text-sm ${
              saldoPendiente < 0 ? "text-danger" : ""
            }`}
          >
            ${saldoPendiente.toLocaleString("es-CL")}
          </p>
        </div>
      </div>

      <div className="h-2 bg-surface rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-ok rounded-full transition-all"
          style={{ width: `${porcentajeCobro}%` }}
        />
      </div>
      <p className="text-text-dim text-xs mb-3">
        {porcentajeCobro.toFixed(0)}% cobrado
      </p>

      {saldoPendiente < 0 && (
        <div className="flex items-center gap-2 bg-danger/10 text-danger text-xs rounded-lg px-3 py-2 mb-3">
          <AlertTriangle size={14} /> Se abonó más de lo cotizado.
        </div>
      )}
      {obraFinalizada && saldoPendiente > 0 && (
        <div className="flex items-center gap-2 bg-warn/10 text-warn text-xs rounded-lg px-3 py-2 mb-3">
          <AlertTriangle size={14} /> Obra finalizada con saldo pendiente.
        </div>
      )}

      {/* Historial */}
      {pagos.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden bg-surface divide-y divide-border">
          {pagos.map((p) => (
            <div key={p.id} className="px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">
                  ${Number(p.monto).toLocaleString("es-CL")}
                </span>
                <span className="text-text-dim text-xs">
                  {new Date(p.fecha + "T00:00:00").toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-text-dim text-xs">
                  {p.metodo}
                  {p.numero_comprobante ? ` · N° ${p.numero_comprobante}` : ""}
                </span>
                {p.archivo_soporte_url && (
                  <button
                    onClick={() => verArchivo(p.archivo_soporte_url!)}
                    className="flex items-center gap-1 text-accent text-xs"
                  >
                    <FileText size={12} /> Ver soporte
                  </button>
                )}
              </div>
              {p.observacion && (
                <p className="text-text-dim text-xs mt-1">{p.observacion}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de nuevo pago */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="bg-surface border border-border rounded-t-2xl md:rounded-2xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">Nuevo pago</h2>
              <button
                onClick={() => {
                  setMostrarForm(false);
                  limpiarForm();
                }}
                className="text-text-dim"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-dim mb-1">Monto *</label>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">Fecha *</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">Método *</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {METODOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              {metodo === "Transferencia" && (
                <div>
                  <label className="block text-xs text-text-dim mb-1">
                    N° comprobante *
                  </label>
                  <input
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-text-dim mb-1">
                  Banco origen (opcional)
                </label>
                <input
                  value={bancoOrigen}
                  onChange={(e) => setBancoOrigen(e.target.value)}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">
                  Observación (opcional)
                </label>
                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">
                  Adjuntar soporte (opcional — PDF, JPG o PNG)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-text-dim"
                />
              </div>

              {error && (
                <p className="text-danger text-xs bg-danger/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={guardarPago}
                disabled={guardando}
                className="w-full rounded-xl bg-accent text-accent-text font-semibold py-3 text-sm disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
