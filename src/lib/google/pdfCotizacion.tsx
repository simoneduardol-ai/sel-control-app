import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
  Circle,
  Line,
  Rect,
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

  body: { paddingHorizontal: 40, paddingTop: 26, paddingBottom: 56 },

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

  condicionesBloque: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  condicionesTitulo: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    color: TEXT_DIM,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  condicionesTexto: { fontSize: 9, color: TEXT_DIM, lineHeight: 1.5, maxWidth: 300 },

  formasPago: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: 190,
  },
  formasPagoLabel: { fontSize: 8.5, fontWeight: 700, color: TEXT, marginBottom: 6 },
  formasPagoFila: { flexDirection: "row", alignItems: "center", gap: 12 },
  formaPagoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  formaPagoTexto: { fontSize: 8, color: TEXT },

  puntosBloque: { marginTop: 22 },
  puntosTitulo: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    color: TEXT_DIM,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  puntoItem: { marginBottom: 8 },
  puntoTitulo: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  puntoTexto: { fontSize: 8.5, color: TEXT_DIM, lineHeight: 1.5 },

  bannerCertificado: {
    backgroundColor: NAVY,
    marginTop: 28,
    marginHorizontal: -40,
    paddingVertical: 8,
    alignItems: "center",
  },
  bannerCertificadoTexto: {
    color: GOLD,
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1,
  },

  serviciosFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginHorizontal: -6,
  },
  servicioBox: { alignItems: "center", width: 78 },
  servicioTitulo: { fontSize: 7.5, fontWeight: 700, marginTop: 4, textAlign: "center" },
  servicioSub: { fontSize: 6.5, color: TEXT_DIM, marginTop: 1, textAlign: "center" },

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

// Íconos simples, minimalistas, dibujados a mano (sin depender de fuentes de
// íconos externas, que no siempre renderizan bien en PDF).
function IconoCirculo({ children }: { children: React.ReactNode }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30">
      <Circle cx={15} cy={15} r={14} stroke={GOLD} strokeWidth={1.4} fill="#ffffff" />
      {children}
    </Svg>
  );
}

const ICONOS: Record<string, React.ReactNode> = {
  parcelas: (
    <IconoCirculo>
      <Path d="M15 8 L22 14 V22 H8 V14 Z" stroke={NAVY} strokeWidth={1.3} fill="none" />
      <Line x1={12.5} y1={22} x2={12.5} y2={17} stroke={NAVY} strokeWidth={1.3} />
      <Line x1={17.5} y1={22} x2={17.5} y2={17} stroke={NAVY} strokeWidth={1.3} />
    </IconoCirculo>
  ),
  respaldo: (
    <IconoCirculo>
      <Path d="M16.5 8 L11 17 H15 L13.5 22 L20 13 H16 Z" fill={NAVY} />
    </IconoCirculo>
  ),
  mediciones: (
    <IconoCirculo>
      <Path
        d="M8.5 18 A6.5 6.5 0 0 1 21.5 18"
        stroke={NAVY}
        strokeWidth={1.3}
        fill="none"
      />
      <Line x1={15} y1={18} x2={18.5} y2={13.5} stroke={NAVY} strokeWidth={1.3} />
      <Circle cx={15} cy={18} r={1.1} fill={NAVY} />
    </IconoCirculo>
  ),
  instalaciones: (
    <IconoCirculo>
      <Rect x={10} y={12} width={10} height={8} stroke={NAVY} strokeWidth={1.3} fill="none" />
      <Line x1={12.5} y1={12} x2={12.5} y2={9} stroke={NAVY} strokeWidth={1.3} />
      <Line x1={17.5} y1={12} x2={17.5} y2={9} stroke={NAVY} strokeWidth={1.3} />
    </IconoCirculo>
  ),
  certificacion: (
    <IconoCirculo>
      <Circle cx={15} cy={15} r={6} stroke={NAVY} strokeWidth={1.3} fill="none" />
      <Path d="M12 15 L14.2 17.2 L18.5 12.5" stroke={NAVY} strokeWidth={1.3} fill="none" />
    </IconoCirculo>
  ),
  seguridad: (
    <IconoCirculo>
      <Rect x={9} y={12.5} width={12} height={8} rx={1.5} stroke={NAVY} strokeWidth={1.3} fill="none" />
      <Circle cx={15} cy={16.5} r={2.6} stroke={NAVY} strokeWidth={1.2} fill="none" />
      <Rect x={12.5} y={10} width={5} height={2.5} stroke={NAVY} strokeWidth={1.2} fill="none" />
    </IconoCirculo>
  ),
};

function IconoBanco() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path d="M2 9 L12 3 L22 9 Z" stroke={NAVY} strokeWidth={1.6} fill="none" />
      <Line x1={4} y1={9} x2={4} y2={19} stroke={NAVY} strokeWidth={1.6} />
      <Line x1={9} y1={9} x2={9} y2={19} stroke={NAVY} strokeWidth={1.6} />
      <Line x1={15} y1={9} x2={15} y2={19} stroke={NAVY} strokeWidth={1.6} />
      <Line x1={20} y1={9} x2={20} y2={19} stroke={NAVY} strokeWidth={1.6} />
      <Line x1={2} y1={21} x2={22} y2={21} stroke={NAVY} strokeWidth={1.6} />
    </Svg>
  );
}

function IconoTarjeta() {
  return (
    <Svg width={15} height={13} viewBox="0 0 24 20">
      <Rect x={1} y={1} width={22} height={18} rx={2.5} stroke={NAVY} strokeWidth={1.6} fill="none" />
      <Line x1={1} y1={7} x2={23} y2={7} stroke={NAVY} strokeWidth={1.6} />
      <Line x1={4} y1={14} x2={10} y2={14} stroke={NAVY} strokeWidth={1.6} />
    </Svg>
  );
}

const SERVICIOS = [
  { key: "parcelas", titulo: "Parcelas", sub: "Empalme + Instalación" },
  { key: "respaldo", titulo: "Respaldo", sub: "Generador + ATS" },
  { key: "mediciones", titulo: "Mediciones", sub: "Instrumentos Uni-T" },
  { key: "instalaciones", titulo: "Instalaciones", sub: "Residenciales y comerciales" },
  { key: "certificacion", titulo: "Certificación", sub: "Trámites ante la SEC" },
  { key: "seguridad", titulo: "Seguridad", sub: "CCTV y automatización" },
];

const PUNTOS_A_CONSIDERAR = [
  {
    titulo: "Alcance de la garantía",
    texto:
      "La mano de obra tiene 12 meses de garantía técnica por fallas de montaje o conexión, mientras que los materiales se rigen por la garantía de sus fabricantes en Chile.",
  },
  {
    titulo: "Modificaciones por terceros",
    texto:
      "La garantía se invalida de forma inmediata si la instalación eléctrica es intervenida o modificada por personal no autorizado o sin licencia SEC.",
  },
  {
    titulo: "Trabajos en exterior y clima",
    texto:
      "Los plazos de faenas al aire libre dependen de las condiciones climáticas. Días de temporal suspenden los trabajos por seguridad y se reprogramarán de mutuo acuerdo.",
  },
];

type ItemPdf = {
  descripcion: string;
  cantidad: number;
  unidad: string;
  total: number;
  mostrarPrecioIndividual: boolean;
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
  conIva,
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
  conIva: boolean;
  fecha: string;
  logoUrl: string;
}): Promise<Buffer> {
  const subtotal = totalMateriales + totalManoObra + totalEquipos;
  const iva = conIva ? subtotal * 0.19 : 0;
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
                // wrap=false: si no cabe entera en lo que queda de página,
                // la fila completa (con su línea divisoria) salta a la
                // siguiente, en vez de partirse a la mitad.
                <View key={i} style={styles.itemFila} wrap={false}>
                  <Text style={styles.itemDescripcion}>
                    {item.descripcion} — {item.cantidad} {item.unidad}
                  </Text>
                  {(mostrarPrecioPorItem || item.mostrarPrecioIndividual) && (
                    <Text style={styles.itemPrecio}>{fmt(item.total)}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}

          <View style={styles.resumen} wrap={false}>
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
              {conIva && (
                <View style={styles.resumenFila}>
                  <Text style={styles.resumenLabel}>IVA (19%)</Text>
                  <Text>{fmt(iva)}</Text>
                </View>
              )}
              <View style={styles.totalFila}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValor}>{fmt(totalConIva)}</Text>
              </View>
            </View>
          </View>

          {!conIva && (
            <Text style={{ fontSize: 8, color: TEXT_DIM, marginTop: 6, textAlign: "right" }}>
              Valores no incluyen IVA, según requerimiento del cliente.
            </Text>
          )}

          <View style={styles.condicionesBloque} wrap={false}>
            <View>
              <Text style={styles.condicionesTitulo}>Condiciones</Text>
              <Text style={styles.condicionesTexto}>
                Validez de esta cotización: 10 días desde la fecha de emisión.{"\n"}
                Forma de pago: a convenir con el cliente.{"\n"}
                Los valores no incluyen imprevistos no contemplados en este detalle.
              </Text>
            </View>

            <View style={styles.formasPago}>
              <Text style={styles.formasPagoLabel}>Formas de pago</Text>
              <View style={styles.formasPagoFila}>
                <View style={styles.formaPagoItem}>
                  <IconoBanco />
                  <Text style={styles.formaPagoTexto}>Transferencia</Text>
                </View>
                <View style={styles.formaPagoItem}>
                  <IconoTarjeta />
                  <Text style={styles.formaPagoTexto}>Tarjeta</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.puntosBloque} wrap={false}>
            <Text style={styles.puntosTitulo}>Puntos a considerar</Text>
            {PUNTOS_A_CONSIDERAR.map((p, i) => (
              <View key={i} style={styles.puntoItem}>
                <Text style={styles.puntoTitulo}>{p.titulo}</Text>
                <Text style={styles.puntoTexto}>{p.texto}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bannerCertificado} wrap={false}>
            <Text style={styles.bannerCertificadoTexto}>
              ELECTRICISTA CERTIFICADO · PUERTO VARAS · LLANQUIHUE · FRUTILLAR
            </Text>
          </View>

          <View style={styles.serviciosFila} wrap={false}>
            {SERVICIOS.map((s) => (
              <View key={s.key} style={styles.servicioBox}>
                {ICONOS[s.key]}
                <Text style={styles.servicioTitulo}>{s.titulo}</Text>
                <Text style={styles.servicioSub}>{s.sub}</Text>
              </View>
            ))}
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
