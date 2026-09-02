import { google } from "googleapis";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // fuerza a que siempre devuelva refresh_token
    scope: ["https://www.googleapis.com/auth/drive.file"],
    state,
  });
}

function getDriveClient(refreshToken: string) {
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: client });
}

const CARPETA_RAIZ_NOMBRE = "Bitácora - Clientes (SEL)";

async function buscarCarpeta(
  drive: ReturnType<typeof getDriveClient>,
  nombre: string,
  parentId?: string
) {
  const q = [
    `name = '${nombre.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parentId ? `'${parentId}' in parents` : undefined,
  ]
    .filter(Boolean)
    .join(" and ");

  const res = await drive.files.list({
    q,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime",
    spaces: "drive",
  });

  // Si por algún motivo llegara a existir más de una carpeta con el mismo
  // nombre (ej. de antes de este arreglo), siempre se usa la más antigua —
  // así todo converge a un solo lugar de forma consistente, en vez de
  // "elegir" una al azar cada vez.
  return res.data.files?.[0]?.id ?? null;
}

async function crearCarpeta(
  drive: ReturnType<typeof getDriveClient>,
  nombre: string,
  parentId?: string
) {
  const res = await drive.files.create({
    requestBody: {
      name: nombre,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  return res.data.id!;
}

async function buscarOCrearCarpeta(
  drive: ReturnType<typeof getDriveClient>,
  nombre: string,
  parentId?: string
) {
  const existente = await buscarCarpeta(drive, nombre, parentId);
  if (existente) return existente;
  return crearCarpeta(drive, nombre, parentId);
}

/**
 * Sube un archivo a Drive dentro de una carpeta raíz / carpeta de cliente
 * (y opcionalmente una subcarpeta más, ej. "Versiones"), creando la
 * estructura si no existe. Devuelve el link al archivo.
 */
export async function subirArchivoACarpetaCliente({
  refreshToken,
  carpetaRaiz = CARPETA_RAIZ_NOMBRE,
  nombreCliente,
  subcarpeta,
  nombreArchivo,
  contenido,
  mimeType,
}: {
  refreshToken: string;
  carpetaRaiz?: string;
  nombreCliente: string;
  subcarpeta?: string;
  nombreArchivo: string;
  contenido: Buffer | string;
  mimeType: string;
}) {
  const drive = getDriveClient(refreshToken);

  const raizId = await buscarOCrearCarpeta(drive, carpetaRaiz);
  let carpetaDestinoId = await buscarOCrearCarpeta(drive, nombreCliente, raizId);
  if (subcarpeta) {
    carpetaDestinoId = await buscarOCrearCarpeta(drive, subcarpeta, carpetaDestinoId);
  }

  const { Readable } = await import("stream");
  const buffer = typeof contenido === "string" ? Buffer.from(contenido, "utf-8") : contenido;
  const res = await drive.files.create({
    requestBody: {
      name: nombreArchivo,
      parents: [carpetaDestinoId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  return {
    fileId: res.data.id,
    url: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}

/** Compatibilidad: PDFs siguen usando esta función específica */
export async function subirPdfACarpetaCliente({
  refreshToken,
  carpetaRaiz = CARPETA_RAIZ_NOMBRE,
  nombreCliente,
  nombreArchivo,
  pdfBuffer,
}: {
  refreshToken: string;
  carpetaRaiz?: string;
  nombreCliente: string;
  nombreArchivo: string;
  pdfBuffer: Buffer;
}) {
  return subirArchivoACarpetaCliente({
    refreshToken,
    carpetaRaiz,
    nombreCliente,
    nombreArchivo,
    contenido: pdfBuffer,
    mimeType: "application/pdf",
  });
}
