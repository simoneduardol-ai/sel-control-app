import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { EMPRESA } from "@/lib/empresa";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  titulo: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  subtitulo: { fontSize: 9, color: "#666666", marginBottom: 4 },
  fecha: { fontSize: 9, color: "#666666", marginBottom: 16 },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#666666",
    marginBottom: 2,
  },
  valor: { fontSize: 10, marginBottom: 10 },
  footer: { fontSize: 8, color: "#999999", marginTop: 20 },
});

type DatosVisita = {
  cliente: string;
  direccion?: string | null;
  referidoPor?: string | null;
  tipoTrabajo?: string | null;
  estado?: string | null;
  etiquetas?: string[];
  medidas?: Record<string, string>;
  descripcion?: string | null;
  notasCliente?: string | null;
  equipos?: string | null;
  costoEquipos?: number;
  totalEstimado?: number;
  kmRecorridos?: number;
  fecha: string;
};

function Fila({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

export async function generarPdfRespaldoInterno(datos: DatosVisita): Promise<Buffer> {
  const medidasTexto = datos.medidas
    ? Object.entries(datos.medidas)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
    : null;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>SERVICIOS ELÉCTRICOS LÓPEZ</Text>
        <Text style={styles.subtitulo}>
          Respaldo interno de visita — no es el informe para el cliente
        </Text>
        <Text style={styles.fecha}>{datos.fecha}</Text>

        <Fila label="Cliente" valor={datos.cliente} />
        <Fila label="Referido por" valor={datos.referidoPor} />
        <Fila label="Dirección" valor={datos.direccion} />
        <Fila label="Tipo de trabajo" valor={datos.tipoTrabajo} />
        <Fila label="Estado" valor={datos.estado} />
        <Fila label="Etiquetas" valor={datos.etiquetas?.join(", ")} />
        <Fila label="Medidas" valor={medidasTexto} />
        <Fila label="Descripción de la actividad" valor={datos.descripcion} />
        <Fila label="Notas personales del cliente" valor={datos.notasCliente} />
        <Fila label="Equipos utilizados" valor={datos.equipos} />
        <Fila
          label="Costo equipos"
          valor={
            datos.costoEquipos
              ? `$${datos.costoEquipos.toLocaleString("es-CL")}`
              : null
          }
        />
        <Fila
          label="Total estimado"
          valor={
            datos.totalEstimado
              ? `$${datos.totalEstimado.toLocaleString("es-CL")}`
              : null
          }
        />
        <Fila
          label="Km recorridos"
          valor={datos.kmRecorridos ? String(datos.kmRecorridos) : null}
        />

        <Text style={styles.footer}>
          Generado automáticamente por SEL Control — {new Date().toISOString()}
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

type DatosInformeCliente = {
  cliente: string;
  direccion?: string | null;
  tipoTrabajo?: string | null;
  fecha: string;
  hallazgos?: string | null;
  fotosUrls: string[];
  totalEstimado?: number | null;
  logoUrl: string;
};

const stylesInforme = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1c1e22" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e3e4e8",
    paddingBottom: 20,
    marginBottom: 24,
  },
  logo: { width: 46, height: 46, borderRadius: 23 },
  empresaNombre: { fontSize: 14, fontWeight: 700 },
  empresaSub: { fontSize: 9.5, color: "#6b7078", marginTop: 2 },
  filaDatos: { flexDirection: "row", marginBottom: 24 },
  dato: { flex: 1 },
  datoLabel: { fontSize: 8, textTransform: "uppercase", color: "#6b7078", marginBottom: 2 },
  datoValor: { fontSize: 10 },
  seccionTitulo: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#6b7078",
    marginBottom: 6,
  },
  parrafo: { fontSize: 10, lineHeight: 1.6, marginBottom: 20 },
  fotosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  foto: { width: 150, height: 112, borderRadius: 4, objectFit: "cover" },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e3e4e8",
    paddingTop: 12,
    marginBottom: 20,
  },
  totalLabel: { fontSize: 10, fontWeight: 700 },
  totalValor: { fontSize: 14, fontWeight: 700 },
  totalNota: { fontSize: 8, color: "#6b7078", marginTop: 2 },
  footer: {
    fontSize: 8,
    color: "#9aa1b5",
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#e3e4e8",
  },
});

export async function generarPdfInformeCliente(datos: DatosInformeCliente): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={stylesInforme.page}>
        <View style={stylesInforme.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={datos.logoUrl} style={stylesInforme.logo} />
          <View>
            <Text style={stylesInforme.empresaNombre}>{EMPRESA.nombre}</Text>
            <Text style={stylesInforme.empresaSub}>
              Informe de {datos.tipoTrabajo || "visita técnica"}
            </Text>
          </View>
        </View>

        <View style={stylesInforme.filaDatos}>
          <View style={stylesInforme.dato}>
            <Text style={stylesInforme.datoLabel}>Cliente</Text>
            <Text style={stylesInforme.datoValor}>{datos.cliente}</Text>
          </View>
          <View style={stylesInforme.dato}>
            <Text style={stylesInforme.datoLabel}>Fecha</Text>
            <Text style={stylesInforme.datoValor}>{datos.fecha}</Text>
          </View>
        </View>

        {datos.direccion && (
          <View style={{ marginTop: -14, marginBottom: 20 }}>
            <Text style={stylesInforme.datoLabel}>Dirección</Text>
            <Text style={stylesInforme.datoValor}>{datos.direccion}</Text>
          </View>
        )}

        {datos.hallazgos && (
          <View>
            <Text style={stylesInforme.seccionTitulo}>Hallazgos y observaciones</Text>
            <Text style={stylesInforme.parrafo}>{datos.hallazgos}</Text>
          </View>
        )}

        {datos.fotosUrls.length > 0 && (
          <View>
            <Text style={stylesInforme.seccionTitulo}>Registro fotográfico</Text>
            <View style={stylesInforme.fotosGrid}>
              {datos.fotosUrls.map((url, i) => (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image key={i} src={url} style={stylesInforme.foto} />
              ))}
            </View>
          </View>
        )}

        {!!datos.totalEstimado && datos.totalEstimado > 0 && (
          <View style={stylesInforme.totalBox}>
            <View>
              <Text style={stylesInforme.totalLabel}>Estimado preliminar</Text>
              <Text style={stylesInforme.totalNota}>
                Sujeto a confirmación en la cotización formal.
              </Text>
            </View>
            <Text style={stylesInforme.totalValor}>
              ${Math.round(datos.totalEstimado).toLocaleString("es-CL")}
            </Text>
          </View>
        )}

        <Text style={stylesInforme.footer}>
          {EMPRESA.nombre} — {EMPRESA.certificacion}
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
