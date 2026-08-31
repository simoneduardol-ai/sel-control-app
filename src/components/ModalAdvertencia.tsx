"use client";

import { AlertTriangle } from "lucide-react";

export default function ModalAdvertencia({
  titulo,
  mensaje,
  textoConfirmar = "Continuar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full">
        <div className="h-10 w-10 rounded-full bg-warn/15 flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-warn" />
        </div>
        <h2 className="font-display text-lg mb-2">{titulo}</h2>
        <p className="text-text-dim text-sm mb-6">{mensaje}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 rounded-xl bg-accent text-accent-text py-2.5 text-sm font-semibold"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
