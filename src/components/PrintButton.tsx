"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden fixed top-4 right-4 z-50 flex items-center gap-2 bg-black text-white rounded-full px-4 py-2.5 text-sm font-medium shadow-lg"
    >
      <Printer size={16} /> Guardar como PDF
    </button>
  );
}
