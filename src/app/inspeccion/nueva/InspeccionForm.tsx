"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Copy, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ClienteSelector, { type ClienteOption } from "@/components/ClienteSelector";
import FotosInspeccion from "@/components/FotosInspeccion";

const SINTOMAS_DISPONIBLES = [
  "Diferencial salta / Se corta la luz",
  "Automático salta",
  "Enchufe no funciona / chisporrotea",
  "Luz parpadea / baja intensidad",
  "Olor a quemado / calentamiento",
  "Cuenta de luz muy alta",
  "Certificación / TE1 / Ampliación",
];

const TRABAJO_DISPONIBLE = [
  "Localización de falla con megger",
  "Desconexión de tramo en falla",
  "Regularización de enchufes / puntos",
  "Peinado de tablero",
  "Reconexión de tierra",
  "Cambio de canalización a EMT",
  "Cambio de tablero",
  "Pruebas finales RCD + Aislación",
];

const DIAGNOSTICOS_RAPIDOS = [
  "Falla de aislación en circuito por cableado deteriorado",
  "Falla por conexión defectuosa en caja de derivación",
  "Tierra desconectada / inexistente",
  "Tablero sin espacio / sin reserva RIC 02",
  "Canalización no conforme RIC 04 (conduit plástico expuesto)",
  "Circuito sin protección diferencial",
];

type Diferencial = {
  rowId: string;
  circuito: string;
  marca_modelo: string;
  corriente_nominal: string;
  sensibilidad: string;
  rcd_x1_0_ms: string;
  rcd_x1_180_ms: string;
  rcd_x5_0_ms: string;
  corriente_fuga_ma: string;
  estado: string;
};

type Aislacion = {
  rowId: string;
  circuito: string;
  tension_prueba: string;
  a_fase_tierra_mohm: string;
  a_neutro_tierra_mohm: string;
  a_fase_neutro_mohm: string;
  b_fase_tierra_mohm: string;
  b_neutro_tierra_mohm: string;
  b_fase_neutro_mohm: string;
  resultado_final: string;
};

function nuevaFilaDiferencial(): Diferencial {
  return {
    rowId: crypto.randomUUID(),
    circuito: "",
    marca_modelo: "",
    corriente_nominal: "",
    sensibilidad: "30mA",
    rcd_x1_0_ms: "",
    rcd_x1_180_ms: "",
    rcd_x5_0_ms: "",
    corriente_fuga_ma: "",
    estado: "",
  };
}

function nuevaFilaAislacion(): Aislacion {
  return {
    rowId: crypto.randomUUID(),
    circuito: "",
    tension_prueba: "500V",
    a_fase_tierra_mohm: "",
    a_neutro_tierra_mohm: "",
    a_fase_neutro_mohm: "",
    b_fase_tierra_mohm: "",
    b_neutro_tierra_mohm: "",
    b_fase_neutro_mohm: "",
    resultado_final: "",
  };
}

function colorMohm(v: string) {
  const n = Number(v);
  if (!v || isNaN(n)) return "";
  if (n < 1) return "text-danger";
  if (n < 100) return "text-warn";
  return "text-ok";
}

function inputClass(extra = "") {
  return `w-full rounded-lg bg-surface border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${extra}`;
}

export default function InspeccionForm({ inspeccionId }: { inspeccionId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const esEdicion = !!inspeccionId;

  const clienteIdPrecargado = searchParams.get("cliente_id");
  const visitaIdPrecargado = searchParams.get("visita_id");

  const [cargando, setCargando] = useState(esEdicion);
  const [cliente, setCliente] = useState<ClienteOption | null>(null);
  const [visitaId, setVisitaId] = useState<string | null>(visitaIdPrecargado);

  // Sección 1
  const [rut, setRut] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoInmueble, setTipoInmueble] = useState("");
  const [numeroEmpalme, setNumeroEmpalme] = useState("");

  // Sección 2
  const [fechaVisita, setFechaVisita] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [tecnico, setTecnico] = useState("Simón López");
  const [licenciaSec, setLicenciaSec] = useState("");

  // Sección 3
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [sintomaOtro, setSintomaOtro] = useState("");
  const [descripcionSintoma, setDescripcionSintoma] = useState("");

  // Secciones 4-6
  const [diferenciales, setDiferenciales] = useState<Diferencial[]>([]);
  const [aislaciones, setAislaciones] = useState<Aislacion[]>([]);

  // Sección 7
  const [comentariosResolucion, setComentariosResolucion] = useState("");
  const [fallaAislada, setFallaAislada] = useState<string>(""); // "", "si", "no"
  const [ubicacionFalla, setUbicacionFalla] = useState("");

  // Sección 8
  const [tierraJabalina, setTierraJabalina] = useState("");
  const [tierraConductorLlega, setTierraConductorLlega] = useState("");
  const [tierraSeccion, setTierraSeccion] = useState("");
  const [tierraContinuidad, setTierraContinuidad] = useState("");
  const [tierraResistencia, setTierraResistencia] = useState("");
  const [tierraEstadoBarra, setTierraEstadoBarra] = useState("");
  const [tierraObservacion, setTierraObservacion] = useState("");

  // Sección 9
  const [diagnosticoRapido, setDiagnosticoRapido] = useState("");
  const [diagnosticoDetallado, setDiagnosticoDetallado] = useState("");
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);

  // Sección 10
  const [trabajoRealizado, setTrabajoRealizado] = useState<string[]>([]);
  const [trabajoOtro, setTrabajoOtro] = useState("");
  const [detalleTrabajo, setDetalleTrabajo] = useState("");

  // Sección 11
  const [materialesUtilizados, setMaterialesUtilizados] = useState("");
  const [materialesPendientes, setMaterialesPendientes] = useState("");
  const [manoObraVisita, setManoObraVisita] = useState("");
  const [presupuestoEtapa2, setPresupuestoEtapa2] = useState("");

  // Sección 12
  const [instaladorNombre, setInstaladorNombre] = useState("Simón López");
  const [clienteConformeNombre, setClienteConformeNombre] = useState("");
  const [estadoVisita, setEstadoVisita] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Precarga cliente/visita cuando viene desde un link
  useEffect(() => {
    if (esEdicion || !clienteIdPrecargado) return;
    (async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nombre, direccion")
        .eq("id", clienteIdPrecargado)
        .single();
      if (data) {
        setCliente(data);
        setDireccion(data.direccion ?? "");
      }
    })();
  }, [clienteIdPrecargado, esEdicion]);

  // Carga completa en modo edición
  useEffect(() => {
    if (!inspeccionId) return;
    (async () => {
      const { data } = await supabase
        .from("inspecciones_electricas")
        .select("*, clientes(id, nombre, direccion)")
        .eq("id", inspeccionId)
        .single();

      if (data) {
        setCliente(data.clientes as unknown as ClienteOption);
        setVisitaId(data.visita_id);
        setRut(data.rut ?? "");
        setTelefono(data.telefono ?? "");
        setEmail(data.email ?? "");
        setDireccion(data.direccion ?? "");
        setTipoInmueble(data.tipo_inmueble ?? "");
        setNumeroEmpalme(data.numero_empalme ?? "");
        setFechaVisita(data.fecha_visita ?? new Date().toISOString().slice(0, 10));
        setHoraInicio(data.hora_inicio?.slice(0, 5) ?? "");
        setHoraFin(data.hora_fin?.slice(0, 5) ?? "");
        setTecnico(data.tecnico ?? "");
        setLicenciaSec(data.licencia_sec ?? "");
        setSintomas(data.sintomas ?? []);
        setSintomaOtro(data.sintoma_otro ?? "");
        setDescripcionSintoma(data.descripcion_sintoma ?? "");
        setComentariosResolucion(data.comentarios_resolucion ?? "");
        setFallaAislada(
          data.falla_aislada === true ? "si" : data.falla_aislada === false ? "no" : ""
        );
        setUbicacionFalla(data.ubicacion_falla ?? "");
        setTierraJabalina(data.tierra_jabalina ?? "");
        setTierraConductorLlega(data.tierra_conductor_llega ?? "");
        setTierraSeccion(data.tierra_seccion ?? "");
        setTierraContinuidad(data.tierra_continuidad_ohm?.toString() ?? "");
        setTierraResistencia(data.tierra_resistencia_ohm?.toString() ?? "");
        setTierraEstadoBarra(data.tierra_estado_barra ?? "");
        setTierraObservacion(data.tierra_observacion ?? "");
        setDiagnosticoRapido(data.diagnostico_rapido ?? "");
        setDiagnosticoDetallado(data.diagnostico_detallado ?? "");
        setTrabajoRealizado(data.trabajo_realizado ?? []);
        setTrabajoOtro(data.trabajo_otro ?? "");
        setDetalleTrabajo(data.detalle_trabajo ?? "");
        setMaterialesUtilizados(data.materiales_utilizados ?? "");
        setMaterialesPendientes(data.materiales_pendientes_etapa2 ?? "");
        setManoObraVisita(data.mano_obra_visita?.toString() ?? "");
        setPresupuestoEtapa2(data.presupuesto_etapa2?.toString() ?? "");
        setInstaladorNombre(data.instalador_nombre ?? "");
        setClienteConformeNombre(data.cliente_conforme_nombre ?? "");
        setEstadoVisita(data.estado_visita ?? "");
        setFotos(data.fotos_urls ?? []);
      }

      const { data: difs } = await supabase
        .from("inspeccion_diferenciales")
        .select("*")
        .eq("inspeccion_id", inspeccionId)
        .order("orden");
      if (difs) {
        setDiferenciales(
          difs.map((d) => ({
            rowId: crypto.randomUUID(),
            circuito: d.circuito ?? "",
            marca_modelo: d.marca_modelo ?? "",
            corriente_nominal: d.corriente_nominal ?? "",
            sensibilidad: d.sensibilidad ?? "30mA",
            rcd_x1_0_ms: d.rcd_x1_0_ms?.toString() ?? "",
            rcd_x1_180_ms: d.rcd_x1_180_ms?.toString() ?? "",
            rcd_x5_0_ms: d.rcd_x5_0_ms?.toString() ?? "",
            corriente_fuga_ma: d.corriente_fuga_ma?.toString() ?? "",
            estado: d.estado ?? "",
          }))
        );
      }

      const { data: aisl } = await supabase
        .from("inspeccion_aislaciones")
        .select("*")
        .eq("inspeccion_id", inspeccionId)
        .order("orden");
      if (aisl) {
        setAislaciones(
          aisl.map((a) => ({
            rowId: crypto.randomUUID(),
            circuito: a.circuito ?? "",
            tension_prueba: a.tension_prueba ?? "500V",
            a_fase_tierra_mohm: a.a_fase_tierra_mohm?.toString() ?? "",
            a_neutro_tierra_mohm: a.a_neutro_tierra_mohm?.toString() ?? "",
            a_fase_neutro_mohm: a.a_fase_neutro_mohm?.toString() ?? "",
            b_fase_tierra_mohm: a.b_fase_tierra_mohm?.toString() ?? "",
            b_neutro_tierra_mohm: a.b_neutro_tierra_mohm?.toString() ?? "",
            b_fase_neutro_mohm: a.b_fase_neutro_mohm?.toString() ?? "",
            resultado_final: a.resultado_final ?? "",
          }))
        );
      }

      setCargando(false);
    })();
  }, [inspeccionId]);

  const duracion = useMemo(() => {
    if (!horaInicio || !horaFin) return null;
    const [h1, m1] = horaInicio.split(":").map(Number);
    const [h2, m2] = horaFin.split(":").map(Number);
    const minutos = h2 * 60 + m2 - (h1 * 60 + m1);
    if (minutos <= 0) return null;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }, [horaInicio, horaFin]);

  const totalPresupuesto =
    (Number(manoObraVisita) || 0) + (Number(presupuestoEtapa2) || 0);

  function toggleEnArreglo(
    valor: string,
    arreglo: string[],
    setter: (v: string[]) => void
  ) {
    setter(
      arreglo.includes(valor) ? arreglo.filter((v) => v !== valor) : [...arreglo, valor]
    );
  }

  function elegirDiagnosticoRapido(valor: string) {
    setDiagnosticoRapido(valor);
    if (!diagnosticoDetallado.trim()) {
      setDiagnosticoDetallado(valor + ". ");
    }
  }

  function copiarParaWhatsapp() {
    const texto = [diagnosticoRapido, diagnosticoDetallado].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(texto);
    setCopiadoWhatsapp(true);
    setTimeout(() => setCopiadoWhatsapp(false), 2000);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);

    const payload = {
      cliente_id: cliente?.id ?? null,
      visita_id: visitaId,
      rut: rut || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      tipo_inmueble: tipoInmueble || null,
      numero_empalme: numeroEmpalme || null,
      fecha_visita: fechaVisita || null,
      hora_inicio: horaInicio || null,
      hora_fin: horaFin || null,
      tecnico: tecnico || null,
      licencia_sec: licenciaSec || null,
      sintomas,
      sintoma_otro: sintomaOtro || null,
      descripcion_sintoma: descripcionSintoma || null,
      comentarios_resolucion: comentariosResolucion || null,
      falla_aislada: fallaAislada === "si" ? true : fallaAislada === "no" ? false : null,
      ubicacion_falla: ubicacionFalla || null,
      tierra_jabalina: tierraJabalina || null,
      tierra_conductor_llega: tierraConductorLlega || null,
      tierra_seccion: tierraSeccion || null,
      tierra_continuidad_ohm: tierraContinuidad ? Number(tierraContinuidad) : null,
      tierra_resistencia_ohm: tierraResistencia ? Number(tierraResistencia) : null,
      tierra_estado_barra: tierraEstadoBarra || null,
      tierra_observacion: tierraObservacion || null,
      diagnostico_rapido: diagnosticoRapido || null,
      diagnostico_detallado: diagnosticoDetallado || null,
      trabajo_realizado: trabajoRealizado,
      trabajo_otro: trabajoOtro || null,
      detalle_trabajo: detalleTrabajo || null,
      materiales_utilizados: materialesUtilizados || null,
      materiales_pendientes_etapa2: materialesPendientes || null,
      mano_obra_visita: manoObraVisita ? Number(manoObraVisita) : null,
      presupuesto_etapa2: presupuestoEtapa2 ? Number(presupuestoEtapa2) : null,
      instalador_nombre: instaladorNombre || null,
      cliente_conforme_nombre: clienteConformeNombre || null,
      estado_visita: estadoVisita || null,
      fotos_urls: fotos,
    };

    const filasDiferenciales = diferenciales
      .filter((d) => d.circuito || d.marca_modelo || d.rcd_x1_0_ms)
      .map((d) => ({
        circuito: d.circuito || null,
        marca_modelo: d.marca_modelo || null,
        corriente_nominal: d.corriente_nominal || null,
        sensibilidad: d.sensibilidad || null,
        rcd_x1_0_ms: d.rcd_x1_0_ms ? Number(d.rcd_x1_0_ms) : null,
        rcd_x1_180_ms: d.rcd_x1_180_ms ? Number(d.rcd_x1_180_ms) : null,
        rcd_x5_0_ms: d.rcd_x5_0_ms ? Number(d.rcd_x5_0_ms) : null,
        corriente_fuga_ma: d.corriente_fuga_ma ? Number(d.corriente_fuga_ma) : null,
        estado: d.estado || null,
      }));

    const filasAislaciones = aislaciones
      .filter((a) => a.circuito || a.a_fase_tierra_mohm)
      .map((a) => ({
        circuito: a.circuito || null,
        tension_prueba: a.tension_prueba || null,
        a_fase_tierra_mohm: a.a_fase_tierra_mohm ? Number(a.a_fase_tierra_mohm) : null,
        a_neutro_tierra_mohm: a.a_neutro_tierra_mohm ? Number(a.a_neutro_tierra_mohm) : null,
        a_fase_neutro_mohm: a.a_fase_neutro_mohm ? Number(a.a_fase_neutro_mohm) : null,
        b_fase_tierra_mohm: a.b_fase_tierra_mohm ? Number(a.b_fase_tierra_mohm) : null,
        b_neutro_tierra_mohm: a.b_neutro_tierra_mohm ? Number(a.b_neutro_tierra_mohm) : null,
        b_fase_neutro_mohm: a.b_fase_neutro_mohm ? Number(a.b_fase_neutro_mohm) : null,
        resultado_final: a.resultado_final || null,
      }));

    try {
      let idFinal = inspeccionId;

      if (esEdicion && inspeccionId) {
        // Edición: pasa por la API, que respalda la versión anterior en
        // Drive (JSON) antes de aplicar el cambio — igual que en visitas.
        const res = await fetch(`/api/inspecciones/${inspeccionId}/editar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            principal: payload,
            diferenciales: filasDiferenciales,
            aislaciones: filasAislaciones,
          }),
        });
        if (!res.ok) throw new Error();
      } else {
        const { data: nueva, error: errIns } = await supabase
          .from("inspecciones_electricas")
          .insert(payload)
          .select("id")
          .single();
        if (errIns) throw errIns;
        idFinal = nueva.id;

        if (filasDiferenciales.length > 0) {
          await supabase.from("inspeccion_diferenciales").insert(
            filasDiferenciales.map((d, i) => ({ ...d, inspeccion_id: idFinal, orden: i }))
          );
        }
        if (filasAislaciones.length > 0) {
          await supabase.from("inspeccion_aislaciones").insert(
            filasAislaciones.map((a, i) => ({ ...a, inspeccion_id: idFinal, orden: i }))
          );
        }
      }

      router.push(`/inspeccion/${idFinal}`);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-dvh bg-bg md:flex">
        <Sidebar />
        <main className="flex-1 md:pl-64 flex items-center justify-center">
          <p className="text-text-dim text-sm">Cargando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-32">
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
          <Link
            href={esEdicion ? `/inspeccion/${inspeccionId}` : "/inspeccion"}
            className="p-1 -ml-1 text-text-dim"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="font-display text-lg">
            {esEdicion ? "Editar inspección" : "Nueva inspección eléctrica"}
          </h1>
        </header>

        <div className="px-5 md:px-8 py-6 max-w-3xl space-y-8">
          <p className="text-text-dim text-xs bg-surface border border-border rounded-xl p-3">
            {esEdicion
              ? "Antes de guardar, se archiva automático una copia de cómo estaba esta inspección antes del cambio (en Drive, dentro de la carpeta del cliente → Inspecciones → Versiones)."
              : "Ningún campo es obligatorio — completa solo lo que corresponda al caso."}
          </p>

          {/* 1. Datos del cliente */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              1. Datos del cliente
            </h2>
            <div className="space-y-3">
              <ClienteSelector value={cliente} onChange={setCliente} />
              <div className="grid grid-cols-2 gap-3">
                <input value={rut} onChange={(e) => setRut(e.target.value)} placeholder="RUT" className={inputClass()} />
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className={inputClass()} />
              </div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass()} />
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección completa" className={inputClass()} />
              <div className="grid grid-cols-2 gap-3">
                <select value={tipoInmueble} onChange={(e) => setTipoInmueble(e.target.value)} className={inputClass()}>
                  <option value="">Tipo de inmueble</option>
                  <option>Casa</option>
                  <option>Parcela</option>
                  <option>Depto</option>
                  <option>Oficina</option>
                  <option>Local</option>
                  <option>Bodega</option>
                  <option>Otro</option>
                </select>
                <input value={numeroEmpalme} onChange={(e) => setNumeroEmpalme(e.target.value)} placeholder="N° Empalme" className={inputClass()} />
              </div>
            </div>
          </section>

          {/* 2. Datos de la visita */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              2. Datos de la visita
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="date" value={fechaVisita} onChange={(e) => setFechaVisita(e.target.value)} className={inputClass()} />
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={inputClass()} />
                <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className={inputClass()} />
              </div>
            </div>
            {duracion && <p className="text-text-dim text-xs mb-3">Duración: {duracion}</p>}
            <div className="grid grid-cols-2 gap-3">
              <input value={tecnico} onChange={(e) => setTecnico(e.target.value)} placeholder="Técnico instalador" className={inputClass()} />
              <input value={licenciaSec} onChange={(e) => setLicenciaSec(e.target.value)} placeholder="Licencia SEC (ej: B-XXXXX)" className={inputClass()} />
            </div>
          </section>

          {/* 3. Síntomas */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              3. Síntoma reportado por el cliente
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {SINTOMAS_DISPONIBLES.map((s) => {
                const activo = sintomas.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleEnArreglo(s, sintomas, setSintomas)}
                    className={`rounded-full px-3 py-1.5 text-sm border transition ${
                      activo ? "bg-accent text-accent-text border-accent" : "bg-surface text-text-dim border-border"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <input value={sintomaOtro} onChange={(e) => setSintomaOtro(e.target.value)} placeholder="Otro síntoma..." className={inputClass("mb-3")} />
            <textarea
              value={descripcionSintoma}
              onChange={(e) => setDescripcionSintoma(e.target.value)}
              placeholder='Descripción detallada. Ej: "C05 salta con carga tras 2 seg..."'
              rows={3}
              className={inputClass("resize-none")}
            />
          </section>

          {/* 4. Diferenciales */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              4. Mediciones de diferencial (RCD)
            </h2>
            <div className="space-y-4">
              {diferenciales.map((d) => (
                <div key={d.rowId} className="border border-border rounded-xl bg-surface p-3 space-y-2">
                  <div className="flex justify-end">
                    <button onClick={() => setDiferenciales((prev) => prev.filter((x) => x.rowId !== d.rowId))} className="text-text-dim">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={d.circuito} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, circuito: e.target.value } : x))} placeholder="Circuito (ej: C05 / General)" className={inputClass()} />
                    <input value={d.marca_modelo} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, marca_modelo: e.target.value } : x))} placeholder="Marca / Modelo" className={inputClass()} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={d.corriente_nominal} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, corriente_nominal: e.target.value } : x))} className={inputClass()}>
                      <option value="">Corriente</option>
                      <option>25A</option><option>40A</option><option>63A</option>
                    </select>
                    <select value={d.sensibilidad} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, sensibilidad: e.target.value } : x))} className={inputClass()}>
                      <option value="">Sensibilidad</option>
                      <option>30mA</option><option>300mA</option>
                    </select>
                    <select value={d.estado} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, estado: e.target.value } : x))} className={inputClass()}>
                      <option value="">Estado</option>
                      <option>OPERATIVO</option><option>SENSIBLE</option><option>NO OPERA</option><option>REEMPLAZAR</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <input type="number" value={d.rcd_x1_0_ms} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, rcd_x1_0_ms: e.target.value } : x))} placeholder="x1 0° ms" className={inputClass()} />
                    <input type="number" value={d.rcd_x1_180_ms} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, rcd_x1_180_ms: e.target.value } : x))} placeholder="x1 180° ms" className={inputClass()} />
                    <input type="number" value={d.rcd_x5_0_ms} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, rcd_x5_0_ms: e.target.value } : x))} placeholder="x5 0° ms" className={inputClass()} />
                    <input type="number" value={d.corriente_fuga_ma} onChange={(e) => setDiferenciales((prev) => prev.map((x) => x.rowId === d.rowId ? { ...x, corriente_fuga_ma: e.target.value } : x))} placeholder="Fuga mA" className={inputClass()} />
                  </div>
                  <p className="text-text-dim text-[11px]">Norma: &lt;300ms en x1 · &lt;40ms en x5</p>
                </div>
              ))}
            </div>
            <button onClick={() => setDiferenciales((prev) => [...prev, nuevaFilaDiferencial()])} className="mt-2 flex items-center gap-1.5 text-accent text-sm font-medium">
              <Plus size={16} /> Agregar diferencial
            </button>
          </section>

          {/* 5-6. Aislación */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              5–6. Pruebas de aislación (Megger) — A inicial / B final
            </h2>
            <div className="space-y-4">
              {aislaciones.map((a) => (
                <div key={a.rowId} className="border border-border rounded-xl bg-surface p-3 space-y-2">
                  <div className="flex justify-end">
                    <button onClick={() => setAislaciones((prev) => prev.filter((x) => x.rowId !== a.rowId))} className="text-text-dim">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={a.circuito} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, circuito: e.target.value } : x))} placeholder="Circuito medido" className={inputClass()} />
                    <select value={a.tension_prueba} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, tension_prueba: e.target.value } : x))} className={inputClass()}>
                      <option>250V</option><option>500V</option><option>1000V</option>
                    </select>
                  </div>
                  <p className="text-xs text-text-dim font-medium">A · Medición inicial (MΩ)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={a.a_fase_tierra_mohm} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, a_fase_tierra_mohm: e.target.value } : x))} placeholder="F-T" className={`${inputClass()} ${colorMohm(a.a_fase_tierra_mohm)}`} />
                    <input type="number" value={a.a_neutro_tierra_mohm} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, a_neutro_tierra_mohm: e.target.value } : x))} placeholder="N-T" className={`${inputClass()} ${colorMohm(a.a_neutro_tierra_mohm)}`} />
                    <input type="number" value={a.a_fase_neutro_mohm} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, a_fase_neutro_mohm: e.target.value } : x))} placeholder="F-N" className={`${inputClass()} ${colorMohm(a.a_fase_neutro_mohm)}`} />
                  </div>
                  <p className="text-xs text-text-dim font-medium">B · Medición final, si aplica (MΩ)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={a.b_fase_tierra_mohm} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, b_fase_tierra_mohm: e.target.value } : x))} placeholder="F-T" className={`${inputClass()} ${colorMohm(a.b_fase_tierra_mohm)}`} />
                    <input type="number" value={a.b_neutro_tierra_mohm} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, b_neutro_tierra_mohm: e.target.value } : x))} placeholder="N-T" className={`${inputClass()} ${colorMohm(a.b_neutro_tierra_mohm)}`} />
                    <input type="number" value={a.b_fase_neutro_mohm} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, b_fase_neutro_mohm: e.target.value } : x))} placeholder="F-N" className={`${inputClass()} ${colorMohm(a.b_fase_neutro_mohm)}`} />
                  </div>
                  <select value={a.resultado_final} onChange={(e) => setAislaciones((prev) => prev.map((x) => x.rowId === a.rowId ? { ...x, resultado_final: e.target.value } : x))} className={inputClass()}>
                    <option value="">Resultado final</option>
                    <option>NORMALIZADO</option><option>MEJORADO</option><option>PERSISTE FALLA</option>
                  </select>
                </div>
              ))}
            </div>
            <button onClick={() => setAislaciones((prev) => [...prev, nuevaFilaAislacion()])} className="mt-2 flex items-center gap-1.5 text-accent text-sm font-medium">
              <Plus size={16} /> Agregar circuito
            </button>
          </section>

          {/* 7. Resolución de falla */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              7. Aislamiento y resolución de falla
            </h2>
            <textarea
              value={comentariosResolucion}
              onChange={(e) => setComentariosResolucion(e.target.value)}
              placeholder="Se aisló falla en... Se retiró cordón 2x2.5 en caja bodega... Circuito queda en 300 MΩ"
              rows={4}
              className={inputClass("resize-none mb-3")}
            />
            <div className="grid grid-cols-2 gap-3">
              <select value={fallaAislada} onChange={(e) => setFallaAislada(e.target.value)} className={inputClass()}>
                <option value="">¿Falla aislada y operativo?</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
              <input value={ubicacionFalla} onChange={(e) => setUbicacionFalla(e.target.value)} placeholder="Ubicación exacta de la falla" className={inputClass()} />
            </div>
          </section>

          {/* 8. Tierra */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              8. Continuidad de puesta a tierra
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select value={tierraJabalina} onChange={(e) => setTierraJabalina(e.target.value)} className={inputClass()}>
                <option value="">¿Existe jabalina?</option>
                <option>Sí</option><option>No</option><option>No visible</option>
              </select>
              <select value={tierraConductorLlega} onChange={(e) => setTierraConductorLlega(e.target.value)} className={inputClass()}>
                <option value="">¿Conductor llega a TDA?</option>
                <option>Sí</option><option>No</option><option>Cortado</option><option>Desconectado</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select value={tierraSeccion} onChange={(e) => setTierraSeccion(e.target.value)} className={inputClass()}>
                <option value="">Sección conductor tierra</option>
                <option>Sin conductor</option><option>2.5mm²</option><option>4mm²</option><option>6mm²</option>
              </select>
              <select value={tierraEstadoBarra} onChange={(e) => setTierraEstadoBarra(e.target.value)} className={inputClass()}>
                <option value="">Estado barra tierra TDA</option>
                <option>Existe</option><option>No existe</option><option>Común con neutro</option><option>Aislada OK</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="number" value={tierraContinuidad} onChange={(e) => setTierraContinuidad(e.target.value)} placeholder="Continuidad medida (Ω) — norma <1Ω" className={inputClass()} />
              <input type="number" value={tierraResistencia} onChange={(e) => setTierraResistencia(e.target.value)} placeholder="Resistencia tierra (Ω) — norma <20Ω" className={inputClass()} />
            </div>
            <textarea value={tierraObservacion} onChange={(e) => setTierraObservacion(e.target.value)} placeholder="Observación..." rows={2} className={inputClass("resize-none")} />
          </section>

          {/* 9. Diagnóstico */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              9. Diagnóstico técnico final
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {DIAGNOSTICOS_RAPIDOS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => elegirDiagnosticoRapido(d)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition ${
                    diagnosticoRapido === d ? "bg-accent text-accent-text border-accent" : "bg-surface text-text-dim border-border"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <textarea
              value={diagnosticoDetallado}
              onChange={(e) => setDiagnosticoDetallado(e.target.value)}
              placeholder="Diagnóstico detallado..."
              rows={4}
              className={inputClass("resize-none mb-2")}
            />
            <button onClick={copiarParaWhatsapp} className="flex items-center gap-1.5 text-accent text-sm font-medium">
              {copiadoWhatsapp ? <Check size={16} /> : <Copy size={16} />}
              {copiadoWhatsapp ? "Copiado" : "Copiar diagnóstico para WhatsApp"}
            </button>
          </section>

          {/* 10. Trabajo realizado */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              10. Trabajo realizado en esta visita
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {TRABAJO_DISPONIBLE.map((t) => {
                const activo = trabajoRealizado.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleEnArreglo(t, trabajoRealizado, setTrabajoRealizado)}
                    className={`rounded-full px-3 py-1.5 text-sm border transition ${
                      activo ? "bg-accent text-accent-text border-accent" : "bg-surface text-text-dim border-border"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <input value={trabajoOtro} onChange={(e) => setTrabajoOtro(e.target.value)} placeholder="Otro..." className={inputClass("mb-3")} />
            <textarea value={detalleTrabajo} onChange={(e) => setDetalleTrabajo(e.target.value)} placeholder="Detalle del trabajo..." rows={3} className={inputClass("resize-none")} />
          </section>

          {/* 11. Materiales y mano de obra */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              11. Materiales y mano de obra
            </h2>
            <textarea value={materialesUtilizados} onChange={(e) => setMaterialesUtilizados(e.target.value)} placeholder="Materiales utilizados en esta visita..." rows={2} className={inputClass("resize-none mb-3")} />
            <textarea value={materialesPendientes} onChange={(e) => setMaterialesPendientes(e.target.value)} placeholder="Materiales pendientes Etapa 2..." rows={2} className={inputClass("resize-none mb-3")} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={manoObraVisita} onChange={(e) => setManoObraVisita(e.target.value)} placeholder="Mano de obra esta visita ($)" className={inputClass()} />
              <input type="number" value={presupuestoEtapa2} onChange={(e) => setPresupuestoEtapa2(e.target.value)} placeholder="Presupuesto Etapa 2 ($)" className={inputClass()} />
            </div>
            {totalPresupuesto > 0 && (
              <p className="text-sm font-medium mt-2">
                Total: ${totalPresupuesto.toLocaleString("es-CL")}
              </p>
            )}
          </section>

          {/* 12. Cierre */}
          <section>
            <h2 className="font-display text-sm uppercase tracking-wide text-text-dim mb-3">
              12. Cierre
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={instaladorNombre} onChange={(e) => setInstaladorNombre(e.target.value)} placeholder="Nombre instalador" className={inputClass()} />
              <input value={clienteConformeNombre} onChange={(e) => setClienteConformeNombre(e.target.value)} placeholder="Nombre cliente conforme" className={inputClass()} />
            </div>
            <select value={estadoVisita} onChange={(e) => setEstadoVisita(e.target.value)} className={inputClass("mb-4")}>
              <option value="">Estado de la visita</option>
              <option>Terminada OK</option>
              <option>Pendiente Etapa 2</option>
              <option>Requiere cotización</option>
              <option>No se pudo resolver</option>
            </select>
            <p className="text-sm font-medium mb-2">Fotos adjuntas</p>
            <FotosInspeccion fotos={fotos} onChange={setFotos} />
          </section>

          {error && (
            <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-bg/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 safe-bottom">
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full max-w-3xl rounded-xl bg-accent text-accent-text font-semibold py-3.5 text-base disabled:opacity-60"
          >
            {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar inspección"}
          </button>
        </div>
      </main>
    </div>
  );
}
