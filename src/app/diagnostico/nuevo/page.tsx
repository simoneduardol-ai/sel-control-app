"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ClienteSelector, { type ClienteOption } from "@/components/ClienteSelector";

const SINTOMAS_DISPONIBLES = [
  "Salta el diferencial al subir el automático sin carga",
  "Salta solo cuando enchufa el calefactor / artefacto",
  "Salta después de un rato funcionando",
  "Hubo perforaciones, humedad o trabajos recientes en bodega/dormitorio",
];

const CAUSAS_DISPONIBLES = [
  "Falla en artefacto calefactor con fuga a tierra",
  "Falla en instalación fija tramo dormitorio",
  "Falla en instalación fija tramo bodega por humedad",
  "Puesta a tierra deficiente / cortada",
  "Diferencial defectuoso",
];

function Toggle2({
  valor,
  onChange,
  opciones,
}: {
  valor: string | null;
  onChange: (v: string) => void;
  opciones: [string, string];
}) {
  return (
    <div className="flex gap-1.5">
      {opciones.map((op) => (
        <button
          key={op}
          type="button"
          onClick={() => onChange(op)}
          className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border ${
            valor === op
              ? op === opciones[0]
                ? "bg-ok/15 border-ok text-ok"
                : "bg-danger/15 border-danger text-danger"
              : "bg-surface border-border text-text-dim"
          }`}
        >
          {op}
        </button>
      ))}
    </div>
  );
}

function CampoMedicion({
  label,
  valor,
  onValorChange,
  unidad,
  resultado,
  onResultadoChange,
  opciones,
}: {
  label: string;
  valor: string;
  onValorChange: (v: string) => void;
  unidad: string;
  resultado: string | null;
  onResultadoChange: (v: string) => void;
  opciones: [string, string];
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-border last:border-0">
      <span className="text-sm flex-1">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={valor}
          onChange={(e) => onValorChange(e.target.value)}
          className="w-16 rounded-lg bg-bg border border-border px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="text-xs text-text-dim w-8">{unidad}</span>
      </div>
      <Toggle2 valor={resultado} onChange={onResultadoChange} opciones={opciones} />
    </div>
  );
}

export default function NuevoDiagnosticoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [cliente, setCliente] = useState<ClienteOption | null>(null);
  const [tecnico, setTecnico] = useState("");
  const [fechaHora, setFechaHora] = useState(() => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
  });
  const [circuitoAfectado, setCircuitoAfectado] = useState("");
  const [automaticoAmperaje, setAutomaticoAmperaje] = useState("");
  const [diferencialMa, setDiferencialMa] = useState("30");
  const [notasCircuito, setNotasCircuito] = useState("");

  const [sintomas, setSintomas] = useState<string[]>([]);
  const [observacionesSintomas, setObservacionesSintomas] = useState("");

  const [rcdLugarPrueba, setRcdLugarPrueba] = useState("");
  const [rcdCorrienteMa, setRcdCorrienteMa] = useState("30");
  const [rcdAngulo0Ms, setRcdAngulo0Ms] = useState("");
  const [rcdAngulo0Resultado, setRcdAngulo0Resultado] = useState<string | null>(null);
  const [rcdAngulo180Ms, setRcdAngulo180Ms] = useState("");
  const [rcdAngulo180Resultado, setRcdAngulo180Resultado] = useState<string | null>(null);
  const [rcdConclusion, setRcdConclusion] = useState("");

  const [meggerFaseTierra, setMeggerFaseTierra] = useState("");
  const [meggerFaseTierraResultado, setMeggerFaseTierraResultado] = useState<string | null>(null);
  const [meggerNeutroTierra, setMeggerNeutroTierra] = useState("");
  const [meggerNeutroTierraResultado, setMeggerNeutroTierraResultado] = useState<string | null>(null);
  const [meggerFaseNeutro, setMeggerFaseNeutro] = useState("");
  const [meggerFaseNeutroResultado, setMeggerFaseNeutroResultado] = useState<string | null>(null);

  const [continuidadOhm, setContinuidadOhm] = useState("");
  const [continuidadResultado, setContinuidadResultado] = useState<string | null>(null);

  const [diagnosticoUbicacion, setDiagnosticoUbicacion] = useState("");
  const [diagnosticoCausas, setDiagnosticoCausas] = useState<string[]>([]);

  const [trabajoRealizado, setTrabajoRealizado] = useState("");
  const [materialesUsados, setMaterialesUsados] = useState("");
  const [manoObraCosto, setManoObraCosto] = useState("");

  const [foto, setFoto] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEnLista(lista: string[], set: (v: string[]) => void, valor: string) {
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  async function guardar() {
    if (!cliente) {
      setError("Selecciona un cliente primero.");
      return;
    }
    setGuardando(true);
    setError(null);

    try {
      const { data: nuevo, error: errIns } = await supabase
        .from("diagnosticos_electricos")
        .insert({
          cliente_id: cliente.id,
          tecnico: tecnico || null,
          fecha_hora: new Date(fechaHora).toISOString(),
          circuito_afectado: circuitoAfectado || null,
          automatico_amperaje: automaticoAmperaje || null,
          diferencial_ma: diferencialMa ? Number(diferencialMa) : null,
          notas_circuito: notasCircuito || null,
          sintomas,
          observaciones_sintomas: observacionesSintomas || null,
          rcd_lugar_prueba: rcdLugarPrueba || null,
          rcd_corriente_ma: rcdCorrienteMa ? Number(rcdCorrienteMa) : null,
          rcd_angulo0_ms: rcdAngulo0Ms ? Number(rcdAngulo0Ms) : null,
          rcd_angulo0_resultado: rcdAngulo0Resultado,
          rcd_angulo180_ms: rcdAngulo180Ms ? Number(rcdAngulo180Ms) : null,
          rcd_angulo180_resultado: rcdAngulo180Resultado,
          rcd_conclusion: rcdConclusion || null,
          megger_fase_tierra_mohm: meggerFaseTierra ? Number(meggerFaseTierra) : null,
          megger_fase_tierra_resultado: meggerFaseTierraResultado,
          megger_neutro_tierra_mohm: meggerNeutroTierra ? Number(meggerNeutroTierra) : null,
          megger_neutro_tierra_resultado: meggerNeutroTierraResultado,
          megger_fase_neutro_mohm: meggerFaseNeutro ? Number(meggerFaseNeutro) : null,
          megger_fase_neutro_resultado: meggerFaseNeutroResultado,
          continuidad_ohm: continuidadOhm ? Number(continuidadOhm) : null,
          continuidad_resultado: continuidadResultado,
          diagnostico_ubicacion: diagnosticoUbicacion || null,
          diagnostico_causas: diagnosticoCausas,
          trabajo_realizado: trabajoRealizado || null,
          materiales_usados: materialesUsados || null,
          mano_obra_costo: manoObraCosto ? Number(manoObraCosto) : null,
        })
        .select("id")
        .single();
      if (errIns) throw errIns;

      if (foto) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ext = foto.name.split(".").pop();
        const path = `${user?.id}/${nuevo.id}/evidencia.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("diagnosticos-media")
          .upload(path, foto);
        if (!upErr) {
          await supabase
            .from("diagnosticos_electricos")
            .update({ foto_evidencia_url: path })
            .eq("id", nuevo.id);
        }
      }

      router.push(`/diagnostico/${nuevo.id}`);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-32">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1 text-text-dim">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-display text-lg">Informe técnico de diagnóstico</h1>
        </header>

        <div className="px-5 md:px-8 py-6 max-w-2xl space-y-8">
          {/* 1. Datos del cliente */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              1. Datos del cliente
            </h2>
            <div className="space-y-3">
              <ClienteSelector value={cliente} onChange={setCliente} />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={tecnico}
                  onChange={(e) => setTecnico(e.target.value)}
                  placeholder="Técnico"
                  className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  value={circuitoAfectado}
                  onChange={(e) => setCircuitoAfectado(e.target.value)}
                  placeholder="Circuito afectado"
                  className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={automaticoAmperaje}
                  onChange={(e) => setAutomaticoAmperaje(e.target.value)}
                  placeholder="Automático (A)"
                  className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="number"
                  value={diferencialMa}
                  onChange={(e) => setDiferencialMa(e.target.value)}
                  placeholder="Diferencial (mA)"
                  className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <textarea
                value={notasCircuito}
                onChange={(e) => setNotasCircuito(e.target.value)}
                placeholder="Notas del circuito..."
                rows={2}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </section>

          {/* 2. Síntomas */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              2. Síntomas reportados por el cliente
            </h2>
            <div className="space-y-2 bg-surface border border-border rounded-xl p-4">
              {SINTOMAS_DISPONIBLES.map((s) => (
                <label key={s} className="flex items-start gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sintomas.includes(s)}
                    onChange={() => toggleEnLista(sintomas, setSintomas, s)}
                    className="h-4 w-4 mt-0.5 accent-accent"
                  />
                  {s}
                </label>
              ))}
            </div>
            <textarea
              value={observacionesSintomas}
              onChange={(e) => setObservacionesSintomas(e.target.value)}
              placeholder="Observaciones..."
              rows={2}
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </section>

          {/* 3. Mediciones */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              3. Mediciones — UNI-T UT526
            </h2>

            <div className="bg-surface border border-border rounded-xl p-4 mb-3">
              <p className="text-xs font-semibold text-text-dim uppercase mb-2">
                A) Prueba de diferencial (RCD)
              </p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <input
                  value={rcdLugarPrueba}
                  onChange={(e) => setRcdLugarPrueba(e.target.value)}
                  placeholder="Lugar de prueba (enchufe)"
                  className="rounded-lg bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="number"
                  value={rcdCorrienteMa}
                  onChange={(e) => setRcdCorrienteMa(e.target.value)}
                  placeholder="Corriente (mA)"
                  className="rounded-lg bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <CampoMedicion
                label="Ángulo 0°"
                valor={rcdAngulo0Ms}
                onValorChange={setRcdAngulo0Ms}
                unidad="ms"
                resultado={rcdAngulo0Resultado}
                onResultadoChange={setRcdAngulo0Resultado}
                opciones={["OK", "MALO"]}
              />
              <CampoMedicion
                label="Ángulo 180°"
                valor={rcdAngulo180Ms}
                onValorChange={setRcdAngulo180Ms}
                unidad="ms"
                resultado={rcdAngulo180Resultado}
                onResultadoChange={setRcdAngulo180Resultado}
                opciones={["OK", "MALO"]}
              />
              <input
                value={rcdConclusion}
                onChange={(e) => setRcdConclusion(e.target.value)}
                placeholder="Conclusión diferencial..."
                className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="bg-surface border border-border rounded-xl p-4 mb-3">
              <p className="text-xs font-semibold text-text-dim uppercase mb-2">
                B) Prueba de aislación (Megger)
              </p>
              <CampoMedicion
                label="Fase a Tierra"
                valor={meggerFaseTierra}
                onValorChange={setMeggerFaseTierra}
                unidad="MΩ"
                resultado={meggerFaseTierraResultado}
                onResultadoChange={setMeggerFaseTierraResultado}
                opciones={["OK", "FALLA"]}
              />
              <CampoMedicion
                label="Neutro a Tierra"
                valor={meggerNeutroTierra}
                onValorChange={setMeggerNeutroTierra}
                unidad="MΩ"
                resultado={meggerNeutroTierraResultado}
                onResultadoChange={setMeggerNeutroTierraResultado}
                opciones={["OK", "FALLA"]}
              />
              <CampoMedicion
                label="Fase a Neutro"
                valor={meggerFaseNeutro}
                onValorChange={setMeggerFaseNeutro}
                unidad="MΩ"
                resultado={meggerFaseNeutroResultado}
                onResultadoChange={setMeggerFaseNeutroResultado}
                opciones={["OK", "FALLA"]}
              />
            </div>

            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-text-dim uppercase mb-2">
                C) Continuidad de tierra
              </p>
              <CampoMedicion
                label="Tierra Tablero → Enchufe"
                valor={continuidadOhm}
                onValorChange={setContinuidadOhm}
                unidad="Ω"
                resultado={continuidadResultado}
                onResultadoChange={setContinuidadResultado}
                opciones={["OK", "CORTADA"]}
              />
            </div>
          </section>

          {/* 4. Diagnóstico */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              4. Diagnóstico técnico final
            </h2>
            <input
              value={diagnosticoUbicacion}
              onChange={(e) => setDiagnosticoUbicacion(e.target.value)}
              placeholder="Ubicación exacta de la falla"
              className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="space-y-2 bg-surface border border-border rounded-xl p-4">
              {CAUSAS_DISPONIBLES.map((c) => (
                <label key={c} className="flex items-start gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diagnosticoCausas.includes(c)}
                    onChange={() => toggleEnLista(diagnosticoCausas, setDiagnosticoCausas, c)}
                    className="h-4 w-4 mt-0.5 accent-accent"
                  />
                  {c}
                </label>
              ))}
            </div>
          </section>

          {/* 5. Trabajo realizado */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              5. Trabajo realizado / presupuesto
            </h2>
            <div className="space-y-3">
              <textarea
                value={trabajoRealizado}
                onChange={(e) => setTrabajoRealizado(e.target.value)}
                placeholder="Descripción del trabajo realizado..."
                rows={3}
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={materialesUsados}
                  onChange={(e) => setMaterialesUsados(e.target.value)}
                  placeholder="Materiales"
                  className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="number"
                  value={manoObraCosto}
                  onChange={(e) => setManoObraCosto(e.target.value)}
                  placeholder="Mano de obra ($)"
                  className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Foto evidencia */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              Evidencia
            </h2>
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-sm text-text-dim cursor-pointer">
              <Camera size={16} />
              {foto ? foto.name : "Foto de la pantalla del UT526 (opcional)"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </section>

          {error && (
            <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-bg/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 safe-bottom">
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full max-w-2xl rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar diagnóstico"}
          </button>
        </div>
      </main>
    </div>
  );
}
