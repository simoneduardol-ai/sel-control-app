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

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: TEXT },

  header: {
    backgroundColor: NAVY,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: { width: 46, height: 46, borderRadius: 23 },
  headerCenter: { marginLeft: 14, flex: 1 },
  empresaNombre: { color: GOLD, fontSize: 15, fontWeight: 700 },
  empresaDato: { color: "#9aa1b5", fontSize: 9, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  cotizacionTitulo: { color: "#ffffff", fontSize: 16, fontWeight: 700 },
  cotizacionNumero: { color: GOLD, fontSize: 11, marginTop: 4, fontWeight: 700 },
  cotizacionFecha: { color: "#9aa1b5", fontSize: 9, marginTop: 4 },

  body: { paddingHorizontal: 40, paddingTop: 26, paddingBottom: 50 },

  clienteBox: {
    backgroundColor: SURFACE,
    borderRadius: 8,
    padding: 14,
    marginBottom: 22,
  },
  clienteLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: TEXT_DIM,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  clienteNombre: { fontSize: 13, fontWeight: 700, marginBottom: 3 },
  clienteDireccion: { fontSize: 10, color: TEXT_DIM },

  etapaTitulo: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  itemFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  itemDescripcion: { flex: 1, paddingRight: 12, lineHeight: 1.4 },
  itemPrecio: { width: 90, textAlign: "right", fontWeight: 700 },

  resumen: { marginTop: 26, alignItems: "flex-end" },
  resumenTabla: { width: 240 },
  resumenFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  resumenLabel: { color: TEXT_DIM },
  totalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: NAVY,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  totalLabel: { color: "#ffffff", fontSize: 12, fontWeight: 700 },
  totalValor: { color: GOLD, fontSize: 14, fontWeight: 700 },

  condiciones: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 16,
  },
  condicionesTitulo: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    color: TEXT_DIM,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  condicionesTexto: { fontSize: 9, color: TEXT_DIM, lineHeight: 1.5 },

  firmas: { flexDirection: "row", justifyContent: "space-between", marginTop: 50 },
  firmaBox: { width: 200, alignItems: "center" },
  firmaLinea: { borderTopWidth: 1, borderTopColor: TEXT, width: "100%", marginBottom: 6 },
  firmaTexto: { fontSize: 9, color: TEXT_DIM },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerTexto: { fontSize: 8, color: TEXT_DIM },
});

type ItemPdf = {
  descripcion: string;
  cantidad: number;
  unidad: string;
  total: number;
};

type EtapaPdf = {
  nombre: string;
  items: ItemPdf[];
};

export async function generarPdfCotizacion({
  numeroCotizacion,
  cliente,
  direccion,
  etapas,
  totalMateriales,
  totalManoObra,
  totalEquipos = 0,
  mostrarPrecioPorItem,
  mostrarTotalMateriales,
  fecha,
  logoUrl,
}: {
  numeroCotizacion: string;
  cliente: string;
  direccion?: string | null;
  etapas: EtapaPdf[];
  totalMateriales: number;
  totalManoObra: number;
  totalEquipos?: number;
  mostrarPrecioPorItem: boolean;
  mostrarTotalMateriales: boolean;
  fecha: string;
  logoUrl: string;
}): Promise<Buffer> {
  const subtotal = totalMateriales + totalManoObra + totalEquipos;
  const iva = subtotal * 0.19;
  const totalConIva = subtotal + iva;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

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
            <Text style={styles.cotizacionTitulo}>COTIZACIÓN</Text>
            <Text style={styles.cotizacionNumero}>{numeroCotizacion}</Text>
            <Text style={styles.cotizacionFecha}>{fecha}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.clienteBox}>
            <Text style={styles.clienteLabel}>Cliente</Text>
            <Text style={styles.clienteNombre}>{cliente}</Text>
            {direccion && <Text style={styles.clienteDireccion}>{direccion}</Text>}
          </View>

          {etapas.map((etapa, idx) => (
            <View key={idx}>
              <Text style={styles.etapaTitulo}>{etapa.nombre}</Text>
              {etapa.items.map((item, i) => (
                <View key={i} style={styles.itemFila}>
                  <Text style={styles.itemDescripcion}>
                    {item.descripcion} — {item.cantidad} {item.unidad}
                  </Text>
                  {mostrarPrecioPorItem && (
                    <Text style={styles.itemPrecio}>{fmt(item.total)}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}

          <View style={styles.resumen}>
            <View style={styles.resumenTabla}>
              {mostrarTotalMateriales && (
                <View style={styles.resumenFila}>
                  <Text style={styles.resumenLabel}>Materiales e insumos</Text>
                  <Text>{fmt(totalMateriales)}</Text>
                </View>
              )}
              <View style={styles.resumenFila}>
                <Text style={styles.resumenLabel}>Subtotal</Text>
                <Text>{fmt(subtotal)}</Text>
              </View>
              <View style={styles.resumenFila}>
                <Text style={styles.resumenLabel}>IVA (19%)</Text>
                <Text>{fmt(iva)}</Text>
              </View>
              <View style={styles.totalFila}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValor}>{fmt(totalConIva)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.condiciones}>
            <Text style={styles.condicionesTitulo}>Condiciones</Text>
            <Text style={styles.condicionesTexto}>
              Validez de esta cotización: 15 días desde la fecha de emisión.{"\n"}
              Forma de pago: a convenir con el cliente.{"\n"}
              Los valores no incluyen imprevistos no contemplados en este detalle.
            </Text>
          </View>

          <View style={styles.firmas}>
            <View style={styles.firmaBox}>
              <View style={styles.firmaLinea} />
              <Text style={styles.firmaTexto}>{EMPRESA.nombre}</Text>
            </View>
            <View style={styles.firmaBox}>
              <View style={styles.firmaLinea} />
              <Text style={styles.firmaTexto}>Cliente</Text>
            </View>
          </View>
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
