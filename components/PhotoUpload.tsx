"use client";
import { useRef, useState } from "react";
import { api, burst, compressImage } from "@/lib/client";
import { sfx } from "@/lib/sound";
import { useToast } from "./Toast";

export default function PhotoUpload({ kind, date, label, className = "btn block", onDone }: {
  kind: "before" | "progress" | "avatar"; date: string; label: React.ReactNode; className?: string; onDone?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      if (kind === "avatar") {
        await api("/api/avatar", { body: { data: await compressImage(f, 600, 0.8) } });
        toast("Nouvelle photo de profil, iconique 📸");
      } else {
        await api("/api/photos", { body: { kind, date, data: await compressImage(f) } });
        toast(kind === "before" ? "Photo de départ enregistrée. Le glow-up commence 📸" : "Ajoutée au Glow-Up Museum 🖼️");
      }
      sfx.win(); burst(false);
      onDone?.();
    } catch (e) { toast((e as Error).message); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" className={className} disabled={busy} onClick={() => ref.current?.click()}>{busy ? "Envoi…" : label}</button>
    </>
  );
}
