"use client";
import { avatarUrl } from "@/lib/client";

type U = { id: number; name: string; emoji: string; color: string; avatarV: number };

/** Photo if she uploaded one, otherwise her emoji on a tinted pearl. Optional progress ring. */
export default function Avatar({ u, size = 44, ring }: { u: U; size?: number; ring?: number }) {
  const src = avatarUrl(u);
  const inner = (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.48, background: `radial-gradient(circle at 30% 25%, #fff, ${u.color}33)` }}>
      {src ? <img src={src} alt={u.name} /> : <span aria-hidden>{u.emoji}</span>}
    </div>
  );
  if (ring === undefined) return inner;
  const s = size + 10, r = s / 2 - 2.5, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: s, height: s, display: "grid", placeItems: "center", flex: "none" }}>
      <svg width={s} height={s} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="rgba(42,11,28,.08)" strokeWidth={3} />
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={u.color} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, ring))} style={{ transition: "stroke-dashoffset .8s" }} />
      </svg>
      {inner}
    </div>
  );
}
