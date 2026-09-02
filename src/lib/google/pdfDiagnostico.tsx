import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import { EMPRESA } from "@/lib/empresa";

const NAVY = "#0b1330";
const GOLD = "#f0b400";
const TEXT = "#1c1e22";
const TEXT_DIM = "#6b7078";
const BORDER = "#e3e4e8";
const SURFACE = "#f7f7f8";
const OK = "#1a9e6b";
const MALO = "#e5484d";

const styles = StyleSheet.create({
  page: { fontSize: 9.5, fontFamily: "Helvetica", color: TEXT },
  header: {
    backgroundColor: NAVY,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: { width: 40, height: 40, borderRadius: 20 },
  headerTexto: { marginLeft: 12, flex: 1 },
  headerTitulo: { color: GOLD, fontSize: 13, fontWeight: 700 },
  headerSub: { color: "#9aa1b5", fontSize: 8.5, marginTop: 2 },
  headerFecha: { color: "#ffffff", fontSize: 9, textAlign: "right" },

  body: { paddingHorizontal: 40, paddingTop: 20, paddingBottom: 50 },

  seccion: { marginTop: 16 },
  seccionTitulo: {
    fontSize: 10,
    fontWeight: 700,
    color: NAVY,
    backgroundColor: SURFACE,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  filaDatos: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  campo: { marginRight: 18, marginBottom: 4 },
  campoLabel: { fontSize: 7.5, color: TEXT_DIM, textTransform: "uppercase" },
  campoValor: { fontSize: 9.5, fontWeight: 700 },

  checkFila: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  checkBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: TEXT_DIM,
    marginRight: 6,
  },
  checkBoxMarcado: { backgroundColor: NAVY, borderColor: NAVY },
  checkTexto: { fontSize: 9, flex: 1 },

  tablaMedicion: { borderWidth: 0.5, borderColor: BORDER, marginBottom: 10 },
  tablaMedicionTitulo: {
    backgroundColor: NAVY,
    color: "#ffffff",
    fontSize: 8.5,
    fontWeight: 700,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  medicionFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },
  medicionLabel: { fontSize: 8.5, flex: 1 },
  medicionValor: { fontSize: 9, fontWeight: 700, width: 70, textAlign: "right" },
  resultadoBadge: {
    fontSize: 7.5,
    fontWeight: 700,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    width: 50,
    textAlign: "center",
    marginLeft: 8,
  },

  textoLibre: {
    fontSize: 9,
    lineHeight: 1.5,
    backgroundColor: SURFACE,
    padding: 8,
    minHeight: 20,
  },

  fotoNota: {
    fontSize: 8,
    color: TEXT_DIM,
    marginTop: 14,
    fontStyle: "italic",
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerTexto: { fontSize: 7.5, color: TEXT_DIM },
});

function Check({ label, marcado }: { label: string; marcado: boolean }) {
  return (
    <View style={styles.checkFila}>
      <View style={marcado ? [styles.checkBox, styles.checkBoxMarcado] : styles.checkBox} />
      <Text style={styles.checkTexto}>{label}</Text>
    </View>
  );
}

function Medicion({
  label,
  valor,
  unidad,
  resultado,
  tipoBueno = "OK",
}: {
  label: string;
  valor: string | number | null | undefined;
  unidad: string;
  resultado: string | null;
  tipoBueno?: string;
}) {
  const esBueno = resultado === tipoBueno;
  return (
    <View style={styles.medicionFila}>
      <Text style={styles.medicionLabel}>{label}</Text>
      <Text style={styles.medicionValor}>
        {valor !== null && valor !== "" ? `${valor} ${unidad}` : "—"}
      </Text>
      {resultado && (
        <Text
          style={[
            styles.resultadoBadge,
            {
              backgroundColor: esBueno ? "#e7f6ef" : "#fbe9ea",
              color: esBueno ? OK : MALO,
            },
          ]}
        >
          {resultado}
        </Text>
      )}
    </View>
  );
}

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

export type DiagnosticoPdfData = {
  clienteNombre: string;
  clienteDireccion?: string | null;
  tecnico?: string | null;
  fechaHora: string;
  circuitoAfectado?: string | null;
  automaticoAmperaje?: string | null;
  diferencialMa?: number | null;
  notasCircuito?: string | null;
  sintomas: string[];
  observacionesSintomas?: string | null;
  rcdLugarPrueba?: string | null;
  rcdCorrienteMa?: number | null;
  rcdAngulo0Ms?: number | null;
  rcdAngulo0Resultado?: string | null;
  rcdAngulo180Ms?: number | null;
  rcdAngulo180Resultado?: string | null;
  rcdConclusion?: string | null;
  meggerFaseTierraMohm?: number | null;
  meggerFaseTierraResultado?: string | null;
  meggerNeutroTierraMohm?: number | null;
  meggerNeutroTierraResultado?: string | null;
  meggerFaseNeutroMohm?: number | null;
  meggerFaseNeutroResultado?: string | null;
  continuidadOhm?: number | null;
  continuidadResultado?: string | null;
  diagnosticoUbicacion?: string | null;
  diagnosticoCausas: string[];
  trabajoRealizado?: string | null;
  materialesUsados?: string | null;
  manoObraCosto?: number | null;
  tieneFoto: boolean;
  logoUrl: string;
};

export async function generarPdfDiagnostico(d: DiagnosticoPdfData): Promise<Buffer> {
  const fecha = new Date(d.fechaHora);
  const fechaFmt = fecha.toLocaleDateString("es-CL", { dateStyle: "long" });
  const horaFmt = fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={d.logoUrl} style={styles.logo} />
          <View style={styles.headerTexto}>
            <Text style={styles.headerTitulo}>
              INFORME TÉCNICO DE VISITA — INSTALACIONES ELÉCTRICAS
            </Text>
            <Text style={styles.headerSub}>
              Norma NCh Elec. 4/2003 · Pliegos RIC SEC · Equipo UNI-T UT526
            </Text>
          </View>
          <Text style={styles.headerFecha}>
            {fechaFmt}{"\n"}
            {horaFmt} hrs
          </Text>
        </View>

        <View style={styles.body}>
          {/* 1. Datos del cliente */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>1. DATOS DEL CLIENTE</Text>
            <View style={styles.filaDatos}>
              <View style={styles.campo}>
                <Text style={styles.campoLabel}>Cliente</Text>
                <Text style={styles.campoValor}>{d.clienteNombre}</Text>
              </View>
              {d.clienteDireccion && (
                <View style={styles.campo}>
                  <Text style={styles.campoLabel}>Dirección</Text>
                  <Text style={styles.campoValor}>{d.clienteDireccion}</Text>
                </View>
              )}
              {d.tecnico && (
                <View style={styles.campo}>
                  <Text style={styles.campoLabel}>Técnico</Text>
                  <Text style={styles.campoValor}>{d.tecnico}</Text>
                </View>
              )}
            </View>
            <View style={styles.filaDatos}>
              {d.circuitoAfectado && (
                <View style={styles.campo}>
                  <Text style={styles.campoLabel}>Circuito afectado</Text>
                  <Text style={styles.campoValor}>{d.circuitoAfectado}</Text>
                </View>
              )}
              {d.automaticoAmperaje && (
                <View style={styles.campo}>
                  <Text style={styles.campoLabel}>Automático</Text>
                  <Text style={styles.campoValor}>{d.automaticoAmperaje} A</Text>
                </View>
              )}
              {d.diferencialMa && (
                <View style={styles.campo}>
                  <Text style={styles.campoLabel}>Diferencial</Text>
                  <Text style={styles.campoValor}>{d.diferencialMa} mA</Text>
                </View>
              )}
            </View>
            {d.notasCircuito && (
              <Text style={styles.textoLibre}>{d.notasCircuito}</Text>
            )}
          </View>

          {/* 2. Síntomas */}
          <View style={styles.seccion} wrap={false}>
            <Text style={styles.seccionTitulo}>2. SÍNTOMAS REPORTADOS POR EL CLIENTE</Text>
            {SINTOMAS_DISPONIBLES.map((s) => (
              <Check key={s} label={s} marcado={d.sintomas.includes(s)} />
            ))}
            {d.observacionesSintomas && (
              <Text style={[styles.textoLibre, { marginTop: 6 }]}>
                {d.observacionesSintomas}
              </Text>
            )}
          </View>

          {/* 3. Mediciones */}
          <View style={styles.seccion} wrap={false}>
            <Text style={styles.seccionTitulo}>3. MEDICIONES REALIZADAS CON UNI-T UT526</Text>

            <View style={styles.tablaMedicion}>
              <Text style={styles.tablaMedicionTitulo}>
                A) PRUEBA DE DIFERENCIAL (RCD) — {d.rcdLugarPrueba || "—"} · {d.rcdCorrienteMa ?? 30} mA
              </Text>
              <Medicion label="Ángulo 0°" valor={d.rcdAngulo0Ms} unidad="ms" resultado={d.rcdAngulo0Resultado ?? null} />
              <Medicion label="Ángulo 180°" valor={d.rcdAngulo180Ms} unidad="ms" resultado={d.rcdAngulo180Resultado ?? null} />
              {d.rcdConclusion && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 8.5, color: TEXT_DIM }}>{d.rcdConclusion}</Text>
                </View>
              )}
            </View>

            <View style={styles.tablaMedicion}>
              <Text style={styles.tablaMedicionTitulo}>B) PRUEBA DE AISLACIÓN (MEGGER)</Text>
              <Medicion label="Fase a Tierra" valor={d.meggerFaseTierraMohm} unidad="MΩ" resultado={d.meggerFaseTierraResultado ?? null} />
              <Medicion label="Neutro a Tierra" valor={d.meggerNeutroTierraMohm} unidad="MΩ" resultado={d.meggerNeutroTierraResultado ?? null} />
              <Medicion label="Fase a Neutro" valor={d.meggerFaseNeutroMohm} unidad="MΩ" resultado={d.meggerFaseNeutroResultado ?? null} />
            </View>

            <View style={styles.tablaMedicion}>
              <Text style={styles.tablaMedicionTitulo}>C) CONTINUIDAD DE TIERRA</Text>
              <Medicion
                label="Tierra Tablero → Enchufe"
                valor={d.continuidadOhm}
                unidad="Ω"
                resultado={d.continuidadResultado ?? null}
              />
            </View>
          </View>

          {/* 4. Diagnóstico */}
          <View style={styles.seccion} wrap={false}>
            <Text style={styles.seccionTitulo}>4. DIAGNÓSTICO TÉCNICO FINAL</Text>
            {d.diagnosticoUbicacion && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.campoLabel}>Ubicación exacta de la falla</Text>
                <Text style={styles.campoValor}>{d.diagnosticoUbicacion}</Text>
              </View>
            )}
            {CAUSAS_DISPONIBLES.map((c) => (
              <Check key={c} label={c} marcado={d.diagnosticoCausas.includes(c)} />
            ))}
          </View>

          {/* 5. Trabajo realizado */}
          <View style={styles.seccion} wrap={false}>
            <Text style={styles.seccionTitulo}>5. TRABAJO REALIZADO / PRESUPUESTO</Text>
            {d.trabajoRealizado && <Text style={styles.textoLibre}>{d.trabajoRealizado}</Text>}
            <View style={[styles.filaDatos, { marginTop: 8 }]}>
              {d.materialesUsados && (
                <View style={styles.campo}>
                  <Text style={styles.campoLabel}>Materiales</Text>
                  <Text style={styles.campoValor}>{d.materialesUsados}</Text>
                </View>
              )}
              {d.manoObraCosto != null && (
                <View style={styles.campo}>
                  <Text style={styles.campoLabel}>Mano de obra</Text>
                  <Text style={styles.campoValor}>
                    ${Math.round(d.manoObraCosto).toLocaleString("es-CL")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {d.tieneFoto && (
            <Text style={styles.fotoNota}>
              Se adjunta fotografía de pantalla UT526 como evidencia de mediciones (archivada
              junto a este informe en Drive).
            </Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerTexto}>
            {EMPRESA.nombre} — {EMPRESA.certificacion}
          </Text>
          <Text
            style={styles.footerTexto}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
