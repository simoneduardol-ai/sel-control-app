"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import NuevaCotizacionContent from "@/app/cotizacion/nueva/NuevaCotizacionContent";

function EditarCotizacionInner() {
  const params = useParams();
  const id = params.id as string;
  return <NuevaCotizacionContent cotizacionId={id} />;
}

export default function EditarCotizacionPage() {
  return (
    <Suspense fallback={null}>
      <EditarCotizacionInner />
    </Suspense>
  );
}
