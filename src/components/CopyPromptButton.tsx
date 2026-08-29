"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyPromptButton({ text }: { text: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(text);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      onClick={copiar}
      className="mt-2 flex items-center gap-1.5 text-accent text-sm font-medium"
    >
      {copiado ? (
        <>
          <Check size={16} /> Copiado
        </>
      ) : (
        <>
          <Copy size={16} /> Copiar prompt
        </>
      )}
    </button>
  );
}
