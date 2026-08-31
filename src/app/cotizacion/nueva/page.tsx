import { Suspense } from "react";
import NuevaCotizacionContent from "./NuevaCotizacionContent";

export default function NuevaCotizacionPage() {
  return (
    <Suspense fallback={null}>
      <NuevaCotizacionContent />
    </Suspense>
  );
}
