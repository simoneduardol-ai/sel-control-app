import { Suspense } from "react";
import InspeccionForm from "./InspeccionForm";

export default function NuevaInspeccionPage() {
  return (
    <Suspense fallback={null}>
      <InspeccionForm />
    </Suspense>
  );
}
