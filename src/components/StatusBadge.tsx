const STATUS_STYLES: Record<string, string> = {
  // visitas
  pendiente: "bg-warn/15 text-warn",
  diagrama: "bg-info/15 text-info",
  cotizando: "bg-accent/15 text-accent",
  cerrada: "bg-ok/15 text-ok",
  // cotizaciones
  BORRADOR: "bg-text-dim/15 text-text-dim",
  EN_PROVEEDORES: "bg-info/15 text-info",
  ENVIADA: "bg-warn/15 text-warn",
  APROBADA: "bg-ok/15 text-ok",
  RECHAZADA: "bg-danger/15 text-danger",
  // obras
  EN_CURSO: "bg-info/15 text-info",
  FINALIZADA: "bg-ok/15 text-ok",
  PAUSADA: "bg-warn/15 text-warn",
  ANULADA: "bg-danger/15 text-danger",
  // seguimiento de visitas (bitácora)
  "En progreso": "bg-info/15 text-info",
  "Requiere seguimiento": "bg-warn/15 text-warn",
  Completado: "bg-ok/15 text-ok",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  diagrama: "Diagrama",
  cotizando: "Cotizando",
  cerrada: "Cerrada",
  BORRADOR: "Borrador",
  EN_PROVEEDORES: "En proveedores",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  PAUSADA: "Pausada",
  ANULADA: "Anulada",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-text-dim/15 text-text-dim";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
