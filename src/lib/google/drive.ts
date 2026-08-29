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
    fields: "files(id, name)",
    spaces: "drive",
  });

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
 * Sube un PDF a Drive dentro de la carpeta del cliente correspondiente,
 * creando la estructura de carpetas si no existe. Devuelve el link al archivo.
 */
export async function subirPdfACarpetaCliente({
  refreshToken,
  nombreCliente,
  nombreArchivo,
  pdfBuffer,
}: {
  refreshToken: string;
  nombreCliente: string;
  nombreArchivo: string;
  pdfBuffer: Buffer;
}) {
  const drive = getDriveClient(refreshToken);

  const raizId = await buscarOCrearCarpeta(drive, CARPETA_RAIZ_NOMBRE);
  const clienteId = await buscarOCrearCarpeta(drive, nombreCliente, raizId);

  const { Readable } = await import("stream");
  const res = await drive.files.create({
    requestBody: {
      name: nombreArchivo,
      parents: [clienteId],
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(pdfBuffer),
    },
    fields: "id, webViewLink",
  });

  return {
    fileId: res.data.id,
    url: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}
