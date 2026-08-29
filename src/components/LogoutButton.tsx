"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={className ?? "text-text-dim p-2 -mr-2"}
      aria-label="Cerrar sesión"
    >
      <LogOut size={20} />
    </button>
  );
}
