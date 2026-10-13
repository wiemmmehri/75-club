"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Compare from "./Compare";
import Sheet from "./Sheet";
import { dayNumber, frDate } from "@/lib/dates";

export type PhotoMeta = { id: number; date: string; kind: "before" | "progress" };

export default function PhotoGallery({ photos, start, onDelete }: { photos: PhotoMeta[]; start: string; onDelete?: (id: number) => void }) {
  const [open, setOpen] = useState<PhotoMeta | null>(null);
  const before = photos.find((p) => p.kind === "before");
  const progress = photos.filter((p) => p.kind === "progress");
  const latest = progress[progress.length - 1];
  const src = (p: PhotoMeta) => `/api/photos/${p.id}`;
  const tag = (p: PhotoMeta) => (p.kind === "before" ? "Day 1" : `Day ${dayNumber(start, p.date)}`);

  return (
    <>
      {before && latest && (
        <div className="section">
          <h2 className="h2">Who I was <em>vs</em> who I&apos;m becoming</h2>
          <Compare before={src(before)} after={src(latest)} beforeLabel="Day 1" afterLabel={tag(latest)} />
        </div>
      )}
      <div className="section">
        <h2 className="h2">Toutes mes photos</h2>
        {photos.length === 0 ? (
          <div className="glass pad" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 34 }}>🖼️</div>
            <p className="muted" style={{ fontWeight: 600, margin: "6px 0 0" }}>Ton musée est vide pour l&apos;instant. Ta version du jour 75 te remerciera.</p>
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map((p, i) => (
              <motion.figure key={p.id} onClick={() => setOpen(p)} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileTap={{ scale: 0.95 }}>
                <img src={src(p)} alt={tag(p)} loading="lazy" />
                <figcaption>{tag(p)}</figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="stack">
            <img src={src(open)} alt="" style={{ borderRadius: 24, width: "100%" }} />
            <div className="row between">
              <div><div style={{ fontWeight: 700 }}>{tag(open)}</div><div className="small muted" style={{ textTransform: "capitalize" }}>{frDate(open.date)}</div></div>
              {onDelete && <button className="btn ghost sm" onClick={() => { if (confirm("Supprimer cette photo ?")) { onDelete(open.id); setOpen(null); } }}>Supprimer</button>}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
