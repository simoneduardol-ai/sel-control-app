import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  HardHat,
  Package,
  ClipboardList,
  Settings,
  Wrench,
  TrendingUp,
  Zap,
  Plus,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "Tablero", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/cotizacion", label: "Cotizaciones", icon: FileText },
  { href: "/obra", label: "Obras", icon: HardHat },
  { href: "/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
  { href: "/inspeccion", label: "Inspecciones", icon: Zap },
  { href: "/catalogo", label: "Catálogo de ítems", icon: ClipboardList },
  { href: "/materiales", label: "Materiales", icon: Package },
  { href: "/equipos", label: "Equipos", icon: Wrench },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:fixed md:inset-y-0 border-r border-sidebar-border bg-sidebar-bg text-sidebar-text">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <p className="font-display text-lg leading-tight">SEL Control</p>
        <p className="text-sidebar-text-dim text-xs mt-0.5">Servicios Eléctricos López</p>
      </div>

      <Link
        href="/visita/nueva"
        className="mx-4 mt-5 flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-text font-semibold py-3 text-sm active:scale-[0.98] transition"
      >
        <Plus size={18} strokeWidth={2.5} />
        Nueva visita
      </Link>

      <nav className="flex-1 px-3 mt-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-text-dim hover:bg-sidebar-hover hover:text-sidebar-text transition"
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border flex items-center justify-between">
        <span className="text-sidebar-text-dim text-xs">slopez@sel.cl</span>
        <LogoutButton className="text-sidebar-text-dim p-2 -mr-2 hover:text-sidebar-text" />
      </div>
    </aside>
  );
}
