"use client";

import { useState } from "react";
import { FileOutput } from "lucide-react";

export default function EmitirPdfInspeccionButton({ inspeccionId }: { inspeccionId: string }) {
  const [cargando, setCargando] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  async function emitir() {
    setCargando(true);
    try {
      const res = await fetch(`/api/inspecciones/${inspeccionId}/emitir`, { method: "POST" });
      if (!res.ok) throw new Error();

      const url = res.headers.get("X-Drive-Url");
      if (url) setDriveUrl(url);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch {
      alert("No se pudo emitir el PDF. Intenta de nuevo.");
    } finally {
      setCargando(false);
      window.location.reload();
    }
  }

  return (
    <div>
      <button
        onClick={emitir}
        disabled={cargando}
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent text-accent-text font-semibold py-3 text-sm disabled:opacity-60"
      >
        <FileOutput size={16} />
        {cargando ? "Generando..." : "Emitir PDF"}
      </button>
      {driveUrl && (
        <a href={driveUrl} target="_blank" rel="noreferrer" className="block text-center text-accent text-xs mt-2">
          Ver copia archivada en Drive ↗
        </a>
      )}
    </div>
  );
}
