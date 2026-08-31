"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Undo2 } from "lucide-react";
import ModalAdvertencia from "@/components/ModalAdvertencia";

export default function RevertirCotizacionButton({
  cotizacionId,
  tieneObraEnCurso,
}: {
  cotizacionId: string;
  tieneObraEnCurso: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function revertir() {
    setGuardando(true);
    await supabase
      .from("cotizaciones")
      .update({
        estado: "BORRADOR",
        motivo_cambio_estado: "Revertida manualmente por el usuario",
      })
      .eq("id", cotizacionId);
    setGuardando(false);
    setMostrarModal(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-3 text-sm font-medium text-text-dim"
      >
        <Undo2 size={15} />
        Revertir a pendiente
      </button>

      {mostrarModal && (
        <ModalAdvertencia
          titulo="¿Revertir a pendiente?"
          mensaje={
            tieneObraEnCurso
              ? "La cotización volverá a estado Pendiente. La obra en ejecución vinculada quedará en PAUSA hasta nueva aprobación."
              : "La cotización volverá a estado Pendiente."
          }
          textoConfirmar={guardando ? "Guardando..." : "Sí, revertir"}
          textoCancelar="Cancelar"
          onConfirmar={revertir}
          onCancelar={() => setMostrarModal(false)}
        />
      )}
    </>
  );
}
