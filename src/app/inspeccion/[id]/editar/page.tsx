"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import InspeccionForm from "@/app/inspeccion/nueva/InspeccionForm";

function EditarInspeccionInner() {
  const params = useParams();
  const id = params.id as string;
  return <InspeccionForm inspeccionId={id} />;
}

export default function EditarInspeccionPage() {
  return (
    <Suspense fallback={null}>
      <EditarInspeccionInner />
    </Suspense>
  );
}
