"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";
import ModalAdvertencia from "@/components/ModalAdvertencia";

export default function MarcarAprobadaButton({
  cotizacionId,
}: {
  cotizacionId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function aprobar() {
    setGuardando(true);
    await supabase
      .from("cotizaciones")
      .update({ estado: "APROBADA" })
      .eq("id", cotizacionId);
    setGuardando(false);
    setMostrarModal(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-ok text-white font-semibold py-3 text-sm"
      >
        <CheckCircle2 size={16} />
        Marcar como aprobada
      </button>

      {mostrarModal && (
        <ModalAdvertencia
          titulo="¿Aprobar esta cotización?"
          mensaje="Al aprobarla se crea automáticamente la obra en ejecución vinculada. Esta acción cambia el estado de la cotización a APROBADA."
          textoConfirmar={guardando ? "Aprobando..." : "Sí, aprobar"}
          textoCancelar="Cancelar"
          onConfirmar={aprobar}
          onCancelar={() => setMostrarModal(false)}
        />
      )}
    </>
  );
}
