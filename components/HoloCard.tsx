"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { avatarUrl } from "@/lib/client";

type Props = {
  u: { id: number; name: string; emoji: string; color: string; avatarV: number; nickname: string | null; signature: string | null; era?: string | null };
  tier: { key: string; label: string };
  stats: { streak: number; perfectDays: number; pct: number };
  number?: number;
};

/** Collectible holographic card. Tilts with your finger, foil shifts with the light. Rarity grows with perfect days. */
export default function HoloCard({ u, tier, stats, number }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5), py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [12, -12]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-14, 14]), { stiffness: 200, damping: 18 });
  const src = avatarUrl(u);

  function move(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    px.set(x); py.set(y);
    ref.current!.style.setProperty("--mx", `${x * 100}%`);
    ref.current!.style.setProperty("--my", `${y * 100}%`);
    ref.current!.style.setProperty("--fx", `${x * 100}%`);
    ref.current!.style.setProperty("--fy", `${y * 100}%`);
  }

  return (
    <div style={{ perspective: 900 }}>
      <motion.div ref={ref} className={`holo t-${tier.key}`} onPointerMove={move}
        onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
        style={{ rotateX: rx, rotateY: ry, background: `linear-gradient(160deg, ${u.color} 0%, #2a0b1c 100%)`, touchAction: "pan-y" }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: 20, overflow: "hidden", background: "#fff" }}>
          {src ? <img src={src} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 120, background: `radial-gradient(circle at 40% 30%, #fff, ${u.color}55)` }}>{u.emoji}</div>}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(42,11,28,0) 40%, rgba(42,11,28,.85) 100%)" }} />
        </div>
        <div style={{ position: "absolute", top: 20, left: 20, right: 20, display: "flex", justifyContent: "space-between" }}>
          <span className="pill" style={{ color: "var(--ink)" }}>{tier.label}</span>
          {number !== undefined && <span className="pill" style={{ color: "var(--ink)" }}>N°{String(number).padStart(2, "0")}/04</span>}
        </div>
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 22 }}>
          <div className="tiny" style={{ fontWeight: 600, opacity: 0.85 }}>{u.nickname || "Member"}</div>
          <div className="serif" style={{ fontSize: 46, lineHeight: 0.95 }}>{u.name} <span style={{ fontSize: 30 }}>{u.emoji}</span></div>
          {u.signature && <div className="serif" style={{ fontStyle: "italic", fontSize: 17, opacity: 0.9, marginTop: 4 }}>« {u.signature} »</div>}
          <div className="row" style={{ marginTop: 12, gap: 16 }}>
            {[["Streak", `${stats.streak}🔥`], ["Perfect", `${stats.perfectDays}`], ["Réussite", `${stats.pct}%`]].map(([k, v]) => (
              <div key={k}><div className="num" style={{ fontSize: 22 }}>{v}</div><div className="tiny" style={{ opacity: 0.75 }}>{k}</div></div>
            ))}
          </div>
        </div>
        <div className="foil" />
      </motion.div>
    </div>
  );
}
