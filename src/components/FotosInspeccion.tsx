"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";

export default function FotosInspeccion({
  fotos,
  onChange,
}: {
  fotos: string[]; // paths en el bucket
  onChange: (fotos: string[]) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [previews, setPrevios] = useState<Record<string, string>>({});

  async function cargarPreview(path: string) {
    if (previews[path]) return;
    const { data } = await supabase.storage
      .from("inspecciones-media")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) setPrevios((prev) => ({ ...prev, [path]: data.signedUrl }));
  }

  fotos.forEach(cargarPreview);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSubiendo(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nuevos: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("inspecciones-media").upload(path, file);
      if (!error) nuevos.push(path);
    }
    onChange([...fotos, ...nuevos]);
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function quitar(path: string) {
    onChange(fotos.filter((f) => f !== path));
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <div className="flex flex-wrap gap-2 mb-2">
        {fotos.map((path) => (
          <div key={path} className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface border border-border">
            {previews[path] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previews[path]} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => quitar(path)}
              className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="flex items-center gap-1.5 text-accent text-sm font-medium disabled:opacity-60"
      >
        {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {subiendo ? "Subiendo..." : "Agregar fotos"}
      </button>
    </div>
  );
}
