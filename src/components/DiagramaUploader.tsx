"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2 } from "lucide-react";

export default function DiagramaUploader({ visitaId }: { visitaId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const ext = file.name.split(".").pop();
      const path = `${user?.id}/${visitaId}/diagrama-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("visitas-media")
        .upload(path, file);
      if (upErr) throw upErr;

      const { error: updErr } = await supabase
        .from("visitas_terreno")
        .update({ diagrama_url: path })
        .eq("id", visitaId);
      if (updErr) throw updErr;

      router.refresh();
    } catch {
      setError("No se pudo subir el diagrama. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="flex items-center gap-1.5 text-accent text-sm font-medium disabled:opacity-60"
      >
        {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {subiendo ? "Subiendo..." : "Subir diagrama (foto o PDF)"}
      </button>
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
}
