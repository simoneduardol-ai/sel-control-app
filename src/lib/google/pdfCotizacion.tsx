import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitulo: { fontSize: 9, color: "#666666", marginBottom: 20 },
  clienteFila: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  etapaTitulo: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  itemFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  itemDescripcion: { flex: 1, paddingRight: 12 },
  itemPrecio: { width: 90, textAlign: "right" },
  resumen: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#000", paddingTop: 12 },
  resumenFila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  totalTexto: { fontSize: 13, fontWeight: 700 },
  footer: { fontSize: 8, color: "#999999", marginTop: 30 },
});

type ItemPdf = {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  total: number;
};

type EtapaPdf = {
  nombre: string;
  items: ItemPdf[];
};

export async function generarPdfCotizacion({
  cliente,
  direccion,
  etapas,
  totalMateriales,
  totalManoObra,
  totalEquipos = 0,
  mostrarPrecioPorItem,
  mostrarTotalMateriales,
  fecha,
}: {
  cliente: string;
  direccion?: string | null;
  etapas: EtapaPdf[];
  totalMateriales: number;
  totalManoObra: number;
  totalEquipos?: number;
  mostrarPrecioPorItem: boolean;
  mostrarTotalMateriales: boolean;
  fecha: string;
}): Promise<Buffer> {
  const subtotal = totalMateriales + totalManoObra + totalEquipos;
  const iva = subtotal * 0.19;
  const totalConIva = subtotal + iva;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>SERVICIOS ELÉCTRICOS LÓPEZ</Text>
        <Text style={styles.subtitulo}>Cotización — válida por 15 días</Text>

        <View style={styles.clienteFila}>
          <View>
            <Text>Cliente: {cliente}</Text>
            {direccion && <Text>{direccion}</Text>}
          </View>
          <Text>{fecha}</Text>
        </View>

        {etapas.map((etapa, idx) => (
          <View key={idx}>
            <Text style={styles.etapaTitulo}>{etapa.nombre}</Text>
            {etapa.items.map((item, i) => (
              <View key={i} style={styles.itemFila}>
                <Text style={styles.itemDescripcion}>
                  {item.descripcion} ({item.cantidad} {item.unidad})
                </Text>
                {mostrarPrecioPorItem && (
                  <Text style={styles.itemPrecio}>{fmt(item.total)}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.resumen}>
          {mostrarTotalMateriales && (
            <View style={styles.resumenFila}>
              <Text>Materiales e insumos</Text>
              <Text>{fmt(totalMateriales)}</Text>
            </View>
          )}
          <View style={styles.resumenFila}>
            <Text>Subtotal</Text>
            <Text>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.resumenFila}>
            <Text>IVA (19%)</Text>
            <Text>{fmt(iva)}</Text>
          </View>
          <View style={styles.totalFila}>
            <Text style={styles.totalTexto}>Total</Text>
            <Text style={styles.totalTexto}>{fmt(totalConIva)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Servicios Eléctricos López — Certificación SEC Clase D · Generado por SEL Control
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
