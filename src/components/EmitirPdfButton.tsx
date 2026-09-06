"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileOutput } from "lucide-react";

export default function EmitirPdfButton({ cotizacionId }: { cotizacionId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  async function emitir() {
    setCargando(true);
    try {
      const res = await fetch(`/api/cotizaciones/${cotizacionId}/emitir`, {
        method: "POST",
      });
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
      // router.refresh() en vez de window.location.reload(): una recarga
      // completa de la página invalida el PDF que se acaba de abrir en la
      // pestaña nueva (el "blob" muere junto con la página que lo creó),
      // por eso se podía ver/imprimir pero no descargar.
      router.refresh();
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
        <a
          href={driveUrl}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-accent text-xs mt-2"
        >
          Ver copia archivada en Drive ↗
        </a>
      )}
    </div>
  );
}
