import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  FileText,
  HardHat,
  Package,
  ClipboardList,
  Plus,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "Tablero", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/cotizacion", label: "Cotizaciones", icon: FileText },
  { href: "/obra", label: "Obras", icon: HardHat },
  { href: "/catalogo", label: "Catálogo de ítems", icon: ClipboardList },
  { href: "/materiales", label: "Materiales", icon: Package },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:fixed md:inset-y-0 border-r border-sidebar-border bg-sidebar-bg text-sidebar-text">
      <div className="px-5 py-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-white/5">
          <Image
            src="/logo-dark.jpg"
            alt="SEL"
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-display text-sm leading-tight">SEL Control</p>
          <p className="text-sidebar-text-dim text-xs">Servicios Eléctricos López</p>
        </div>
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
