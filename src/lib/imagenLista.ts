export type FilaLista = {
  nombre: string;
  cantidad: number;
  unidad: string;
};

function envolverTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  maxAncho: number
): string[] {
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let lineaActual = "";

  for (const palabra of palabras) {
    const prueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > maxAncho && lineaActual) {
      lineas.push(lineaActual);
      lineaActual = palabra;
    } else {
      lineaActual = prueba;
    }
  }
  if (lineaActual) lineas.push(lineaActual);
  return lineas;
}

export function generarImagenLista({
  titulo,
  subtitulo,
  filas,
}: {
  titulo: string;
  subtitulo: string;
  filas: FilaLista[];
}): string {
  const ANCHO = 800;
  const PADDING = 32;
  const COL_CANTIDAD_ANCHO = 140;
  const ALTO_HEADER = 110;
  const ALTO_FILA_BASE = 40;
  const LINEA_ALTO = 22;

  // Canvas temporal solo para medir texto y calcular alto real
  const medirCanvas = document.createElement("canvas");
  const medirCtx = medirCanvas.getContext("2d")!;
  medirCtx.font = "16px -apple-system, sans-serif";

  const anchoTextoDisponible = ANCHO - PADDING * 2 - COL_CANTIDAD_ANCHO;
  const filasConLineas = filas.map((f) => ({
    ...f,
    lineas: envolverTexto(medirCtx, f.nombre, anchoTextoDisponible),
  }));

  const altoFilas = filasConLineas.reduce(
    (sum, f) => sum + Math.max(ALTO_FILA_BASE, f.lineas.length * LINEA_ALTO + 18),
    0
  );
  const ALTO_FOOTER = 50;
  const alto = ALTO_HEADER + altoFilas + ALTO_FOOTER;

  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = alto;
  const ctx = canvas.getContext("2d")!;

  // Fondo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO, alto);

  // Header
  ctx.fillStyle = "#0b1330";
  ctx.fillRect(0, 0, ANCHO, ALTO_HEADER);
  ctx.fillStyle = "#f0b400";
  ctx.font = "bold 22px -apple-system, sans-serif";
  ctx.fillText("SERVICIOS ELÉCTRICOS LÓPEZ", PADDING, 42);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px -apple-system, sans-serif";
  ctx.fillText(titulo, PADDING, 72);
  ctx.fillStyle = "#9aa1b5";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText(subtitulo, PADDING, 94);

  // Filas
  let y = ALTO_HEADER;
  filasConLineas.forEach((f, i) => {
    const altoFila = Math.max(ALTO_FILA_BASE, f.lineas.length * LINEA_ALTO + 18);

    if (i % 2 === 0) {
      ctx.fillStyle = "#f7f7f8";
      ctx.fillRect(0, y, ANCHO, altoFila);
    }

    ctx.fillStyle = "#1c1e22";
    ctx.font = "16px -apple-system, sans-serif";
    f.lineas.forEach((linea, li) => {
      ctx.fillText(linea, PADDING, y + 26 + li * LINEA_ALTO);
    });

    ctx.font = "bold 16px -apple-system, sans-serif";
    ctx.fillStyle = "#0b1330";
    const textoCantidad = `${f.cantidad} ${f.unidad}`;
    const anchoCantidad = ctx.measureText(textoCantidad).width;
    ctx.fillText(textoCantidad, ANCHO - PADDING - anchoCantidad, y + 26);

    y += altoFila;
    ctx.strokeStyle = "#e3e4e8";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ANCHO, y);
    ctx.stroke();
  });

  // Footer
  ctx.fillStyle = "#9aa1b5";
  ctx.font = "12px -apple-system, sans-serif";
  ctx.fillText(
    `Generado por SEL Control — ${new Date().toLocaleDateString("es-CL")}`,
    PADDING,
    alto - 20
  );

  return canvas.toDataURL("image/png");
}

export function descargarImagen(dataUrl: string, nombreArchivo: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = nombreArchivo;
  link.click();
}
