import fs from "fs";
import path from "path";

const cache: Record<string, string> = {};

/**
 * Lee un archivo de /public directo del disco del servidor y lo devuelve
 * como data URI base64 — evita que el PDF tenga que "bajar" el logo desde
 * su propia URL pública (esa vuelta por internet podía fallar en silencio).
 */
export function logoComoDataUri(nombreArchivo: "logo-dark.jpg" | "logo-light.png"): string {
  if (cache[nombreArchivo]) return cache[nombreArchivo];

  const rutaArchivo = path.join(process.cwd(), "public", nombreArchivo);
  const buffer = fs.readFileSync(rutaArchivo);
  const mime = nombreArchivo.endsWith(".png") ? "image/png" : "image/jpeg";
  const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;

  cache[nombreArchivo] = dataUri;
  return dataUri;
}
