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
const RED = "#c0392b";
const YELLOW = "#b8860b";
const GREEN = "#1a9e6b";

const styles = StyleSheet.create({
  page: { fontSize: 9, fontFamily: "Helvetica", color: TEXT },
  header: {
    backgroundColor: NAVY,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: { width: 40, height: 40, borderRadius: 20 },
  headerCenter: { marginLeft: 12, flex: 1 },
  empresaNombre: { color: GOLD, fontSize: 13, fontWeight: 700 },
  empresaDato: { color: "#9aa1b5", fontSize: 8, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  titulo: { color: "#ffffff", fontSize: 13, fontWeight: 700 },
  subtitulo: { color: "#9aa1b5", fontSize: 7.5, marginTop: 3, maxWidth: 180, textAlign: "right" },
  numeroOt: { color: GOLD, fontSize: 10, marginTop: 4, fontWeight: 700 },

  body: { paddingHorizontal: 40, paddingTop: 18, paddingBottom: 50 },

  seccion: { marginTop: 14 },
  seccionTitulo: {
    fontSize: 9.5,
    fontWeight: 700,
    color: NAVY,
    backgroundColor: SURFACE,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  filaDatos: { flexDirection: "row", flexWrap: "wrap" },
  dato: { width: "50%", marginBottom: 5, paddingRight: 8 },
  datoLabel: { fontSize: 7, color: TEXT_DIM, textTransform: "uppercase" },
  datoValor: { fontSize: 9, marginTop: 1 },

  chipsFila: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 },
  chip: {
    fontSize: 7.5,
    backgroundColor: SURFACE,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },

  tabla: { borderWidth: 0.5, borderColor: BORDER, marginBottom: 6 },
  filaTabla: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER },
  filaTablaHeader: { flexDirection: "row", backgroundColor: SURFACE },
  celda: { flex: 1, fontSize: 7, padding: 4 },
  celdaHeader: { flex: 1, fontSize: 7, padding: 4, fontWeight: 700, color: TEXT_DIM },

  textoParrafo: { fontSize: 8.5, lineHeight: 1.5, color: TEXT },

  fotosFila: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  foto: { width: 110, height: 82, borderRadius: 4, objectFit: "cover" },

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

function colorMohm(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return TEXT;
  if (valor < 1) return RED;
  if (valor < 100) return YELLOW;
  return GREEN;
}

function colorMs(valor: number | null | undefined, limite: number) {
  if (valor === null || valor === undefined) return TEXT;
  return valor <= limite ? GREEN : RED;
}

function Dato({ label, valor }: { label: string; valor?: string | number | null }) {
  if (valor === null || valor === undefined || valor === "") return null;
  return (
    <View style={styles.dato}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValor}>{String(valor)}</Text>
    </View>
  );
}

export type DiferencialPdf = {
  circuito?: string | null;
  marca_modelo?: string | null;
  corriente_nominal?: string | null;
  sensibilidad?: string | null;
  rcd_x1_0_ms?: number | null;
  rcd_x1_180_ms?: number | null;
  rcd_x5_0_ms?: number | null;
  corriente_fuga_ma?: number | null;
  estado?: string | null;
};

export type AislacionPdf = {
  circuito?: string | null;
  tension_prueba?: string | null;
  a_fase_tierra_mohm?: number | null;
  a_neutro_tierra_mohm?: number | null;
  a_fase_neutro_mohm?: number | null;
  b_fase_tierra_mohm?: number | null;
  b_neutro_tierra_mohm?: number | null;
  b_fase_neutro_mohm?: number | null;
  resultado_final?: string | null;
};

export async function generarPdfInspeccion({
  numeroOt,
  cliente,
  logoUrl,
  fecha,
  datos,
  diferenciales,
  aislaciones,
  fotosUrls,
}: {
  numeroOt: string;
  cliente: string;
  logoUrl: string;
  fecha: string;
  datos: Record<string, string | number | boolean | null | undefined>;
  diferenciales: DiferencialPdf[];
  aislaciones: AislacionPdf[];
  fotosUrls: string[];
}): Promise<Buffer> {
  const d = datos;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.headerCenter}>
            <Text style={styles.empresaNombre}>{EMPRESA.nombre.toUpperCase()}</Text>
            <Text style={styles.empresaDato}>{EMPRESA.direccion}</Text>
            <Text style={styles.empresaDato}>
              {EMPRESA.telefono} · {EMPRESA.email}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.titulo}>INFORME TÉCNICO DE INSPECCIÓN</Text>
            <Text style={styles.subtitulo}>NCh Elec. 4/2003 · Pliegos RIC SEC</Text>
            <Text style={styles.numeroOt}>{numeroOt}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>1. Datos del cliente</Text>
            <View style={styles.filaDatos}>
              <Dato label="Cliente" valor={cliente} />
              <Dato label="RUT" valor={d.rut as string} />
              <Dato label="Teléfono" valor={d.telefono as string} />
              <Dato label="Email" valor={d.email as string} />
              <Dato label="Dirección" valor={d.direccion as string} />
              <Dato label="Tipo de inmueble" valor={d.tipo_inmueble as string} />
              <Dato label="N° Empalme" valor={d.numero_empalme as string} />
            </View>
          </View>

          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>2. Datos de la visita</Text>
            <View style={styles.filaDatos}>
              <Dato label="Fecha" valor={fecha} />
              <Dato label="Hora inicio" valor={d.hora_inicio as string} />
              <Dato label="Hora fin" valor={d.hora_fin as string} />
              <Dato label="Técnico" valor={d.tecnico as string} />
              <Dato label="Licencia SEC" valor={d.licencia_sec as string} />
            </View>
          </View>

          {((d.sintomas as unknown as string[])?.length > 0 || d.descripcion_sintoma) && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>3. Síntoma reportado por el cliente</Text>
              {(d.sintomas as unknown as string[])?.length > 0 && (
                <View style={styles.chipsFila}>
                  {(d.sintomas as unknown as string[]).map((s, i) => (
                    <Text key={i} style={styles.chip}>
                      {s}
                    </Text>
                  ))}
                </View>
              )}
              {!!d.descripcion_sintoma && (
                <Text style={styles.textoParrafo}>{d.descripcion_sintoma as string}</Text>
              )}
            </View>
          )}

          {diferenciales.length > 0 && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>4. Mediciones de diferencial (RCD)</Text>
              <View style={styles.tabla}>
                <View style={styles.filaTablaHeader}>
                  <Text style={styles.celdaHeader}>Circuito</Text>
                  <Text style={styles.celdaHeader}>Sensib.</Text>
                  <Text style={styles.celdaHeader}>x1 0° ms</Text>
                  <Text style={styles.celdaHeader}>x1 180° ms</Text>
                  <Text style={styles.celdaHeader}>Fuga mA</Text>
                  <Text style={styles.celdaHeader}>Estado</Text>
                </View>
                {diferenciales.map((r, i) => (
                  <View key={i} style={styles.filaTabla}>
                    <Text style={styles.celda}>{r.circuito || "—"}</Text>
                    <Text style={styles.celda}>{r.sensibilidad || "—"}</Text>
                    <Text style={[styles.celda, { color: colorMs(r.rcd_x1_0_ms, 300) }]}>
                      {r.rcd_x1_0_ms ?? "—"}
                    </Text>
                    <Text style={[styles.celda, { color: colorMs(r.rcd_x1_180_ms, 300) }]}>
                      {r.rcd_x1_180_ms ?? "—"}
                    </Text>
                    <Text style={styles.celda}>{r.corriente_fuga_ma ?? "—"}</Text>
                    <Text style={styles.celda}>{r.estado || "—"}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {aislaciones.length > 0 && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>
                5–6. Pruebas de aislación (Megger) — A: inicial / B: final
              </Text>
              <View style={styles.tabla}>
                <View style={styles.filaTablaHeader}>
                  <Text style={styles.celdaHeader}>Circuito</Text>
                  <Text style={styles.celdaHeader}>A: F-T</Text>
                  <Text style={styles.celdaHeader}>A: N-T</Text>
                  <Text style={styles.celdaHeader}>A: F-N</Text>
                  <Text style={styles.celdaHeader}>B: F-T</Text>
                  <Text style={styles.celdaHeader}>Resultado</Text>
                </View>
                {aislaciones.map((r, i) => (
                  <View key={i} style={styles.filaTabla}>
                    <Text style={styles.celda}>{r.circuito || "—"}</Text>
                    <Text style={[styles.celda, { color: colorMohm(r.a_fase_tierra_mohm) }]}>
                      {r.a_fase_tierra_mohm ?? "—"}
                    </Text>
                    <Text style={[styles.celda, { color: colorMohm(r.a_neutro_tierra_mohm) }]}>
                      {r.a_neutro_tierra_mohm ?? "—"}
                    </Text>
                    <Text style={[styles.celda, { color: colorMohm(r.a_fase_neutro_mohm) }]}>
                      {r.a_fase_neutro_mohm ?? "—"}
                    </Text>
                    <Text style={[styles.celda, { color: colorMohm(r.b_fase_tierra_mohm) }]}>
                      {r.b_fase_tierra_mohm ?? "—"}
                    </Text>
                    <Text style={styles.celda}>{r.resultado_final || "—"}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!!d.comentarios_resolucion && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>7. Aislamiento y resolución de falla</Text>
              <Text style={styles.textoParrafo}>{d.comentarios_resolucion as string}</Text>
              <View style={styles.filaDatos}>
                <Dato
                  label="Falla aislada y operativo"
                  valor={d.falla_aislada === true ? "Sí" : d.falla_aislada === false ? "No" : null}
                />
                <Dato label="Ubicación de la falla" valor={d.ubicacion_falla as string} />
              </View>
            </View>
          )}

          {(d.tierra_jabalina || d.tierra_continuidad_ohm) && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>8. Continuidad de puesta a tierra</Text>
              <View style={styles.filaDatos}>
                <Dato label="Jabalina" valor={d.tierra_jabalina as string} />
                <Dato label="Conductor llega a TDA" valor={d.tierra_conductor_llega as string} />
                <Dato label="Sección conductor" valor={d.tierra_seccion as string} />
                <Dato label="Continuidad (Ω)" valor={d.tierra_continuidad_ohm as number} />
                <Dato label="Resistencia tierra (Ω)" valor={d.tierra_resistencia_ohm as number} />
                <Dato label="Estado barra TDA" valor={d.tierra_estado_barra as string} />
              </View>
              {!!d.tierra_observacion && (
                <Text style={styles.textoParrafo}>{d.tierra_observacion as string}</Text>
              )}
            </View>
          )}

          {!!d.diagnostico_detallado && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>9. Diagnóstico técnico final</Text>
              {!!d.diagnostico_rapido && (
                <Text style={[styles.textoParrafo, { fontWeight: 700, marginBottom: 3 }]}>
                  {d.diagnostico_rapido as string}
                </Text>
              )}
              <Text style={styles.textoParrafo}>{d.diagnostico_detallado as string}</Text>
            </View>
          )}

          {((d.trabajo_realizado as unknown as string[])?.length > 0 || d.detalle_trabajo) && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>10. Trabajo realizado en esta visita</Text>
              {(d.trabajo_realizado as unknown as string[])?.length > 0 && (
                <View style={styles.chipsFila}>
                  {(d.trabajo_realizado as unknown as string[]).map((s, i) => (
                    <Text key={i} style={styles.chip}>
                      {s}
                    </Text>
                  ))}
                </View>
              )}
              {!!d.detalle_trabajo && (
                <Text style={styles.textoParrafo}>{d.detalle_trabajo as string}</Text>
              )}
            </View>
          )}

          {(d.materiales_utilizados || d.mano_obra_visita || d.presupuesto_etapa2) && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>11. Materiales y mano de obra</Text>
              {!!d.materiales_utilizados && (
                <Text style={styles.textoParrafo}>
                  Materiales: {d.materiales_utilizados as string}
                </Text>
              )}
              {!!d.materiales_pendientes_etapa2 && (
                <Text style={styles.textoParrafo}>
                  Pendientes Etapa 2: {d.materiales_pendientes_etapa2 as string}
                </Text>
              )}
              <View style={styles.filaDatos}>
                <Dato
                  label="Mano de obra esta visita"
                  valor={
                    d.mano_obra_visita
                      ? `$${Number(d.mano_obra_visita).toLocaleString("es-CL")}`
                      : null
                  }
                />
                <Dato
                  label="Presupuesto Etapa 2"
                  valor={
                    d.presupuesto_etapa2
                      ? `$${Number(d.presupuesto_etapa2).toLocaleString("es-CL")}`
                      : null
                  }
                />
              </View>
            </View>
          )}

          <View style={styles.seccion} wrap={false}>
            <Text style={styles.seccionTitulo}>12. Cierre</Text>
            <View style={styles.filaDatos}>
              <Dato label="Instalador" valor={d.instalador_nombre as string} />
              <Dato label="Cliente conforme" valor={d.cliente_conforme_nombre as string} />
              <Dato label="Estado de la visita" valor={d.estado_visita as string} />
            </View>
          </View>

          {fotosUrls.length > 0 && (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>Fotografías y evidencia</Text>
              <View style={styles.fotosFila}>
                {fotosUrls.map((url, i) => (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image key={i} src={url} style={styles.foto} />
                ))}
              </View>
            </View>
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
