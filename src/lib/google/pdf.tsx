import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
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
