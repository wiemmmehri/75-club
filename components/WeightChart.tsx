"use client";
import { useEffect, useRef, useState } from "react";
import { diffDays, frDate } from "@/lib/dates";

type Pt = { date: string; v: number };

/**
 * Weight over time: one line, soft area, dashed goal line, crosshair + tooltip on touch.
 * Text stays in ink colors, only the line wears the accent.
 */
export default function WeightChart({ points, goal, start, unit = "kg", color = "#FF3D7F" }: {
  points: Pt[]; goal?: number | null; start: string; unit?: string; color?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length === 0) return null;
  const H = 200, L = 34, R = 14, T = 16, B = 24;
  const x0 = points[0].date, x1 = points[points.length - 1].date;
  const span = Math.max(1, diffDays(x0, x1));
  const vals = points.map((p) => p.v).concat(goal ? [goal] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(0.6, (hi - lo) * 0.18);
  lo = Math.floor((lo - pad) * 2) / 2; hi = Math.ceil((hi + pad) * 2) / 2;
  const X = (d: string) => L + (diffDays(x0, d) / span) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const step = (hi - lo) / 4;
  const ticks = Array.from({ length: 5 }, (_, i) => lo + step * i);
  const line = points.map((p, i) => `${i ? "L" : "M"}${X(p.date).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${X(x1).toFixed(1)},${H - B} L${X(x0).toFixed(1)},${H - B} Z`;
  const last = points[points.length - 1];
  const h = hover !== null ? points[hover] : null;

  function onMove(clientX: number) {
    const r = wrap.current!.getBoundingClientRect();
    const px = clientX - r.left;
    let best = 0, bd = Infinity;
    points.forEach((p, i) => { const d = Math.abs(X(p.date) - px); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  }

  return (
    <div ref={wrap} style={{ position: "relative", touchAction: "pan-y" }}
      onPointerMove={(e) => onMove(e.clientX)} onPointerDown={(e) => onMove(e.clientX)} onPointerLeave={() => setHover(null)}>
      <svg width={w} height={H} role="img" aria-label={`Courbe de poids, de ${points[0].v} à ${last.v} ${unit}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={w - R} y1={Y(t)} y2={Y(t)} stroke="rgba(42,11,28,.07)" />
            <text x={L - 8} y={Y(t) + 4} textAnchor="end" fontSize="10.5" fill="var(--ink-3)" fontWeight="600">{t.toFixed(step < 1 ? 1 : 0)}</text>
          </g>
        ))}
        <text x={L} y={H - 6} fontSize="10.5" fill="var(--ink-3)" fontWeight="600">J{diffDays(start, x0) + 1}</text>
        <text x={w - R} y={H - 6} fontSize="10.5" fill="var(--ink-3)" fontWeight="600" textAnchor="end">J{diffDays(start, x1) + 1}</text>
        {goal && goal >= lo && goal <= hi && (
          <g>
            <line x1={L} x2={w - R} y1={Y(goal)} y2={Y(goal)} stroke="var(--ink-2)" strokeDasharray="4 5" strokeWidth="1.2" />
            <text x={w - R} y={Y(goal) - 6} textAnchor="end" fontSize="10.5" fill="var(--ink-2)" fontWeight="700">🎯 objectif {goal}</text>
          </g>
        )}
        {points.length > 1 && <path d={area} fill="url(#wfill)" />}
        {points.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <circle key={p.date} cx={X(p.date)} cy={Y(p.v)} r={i === points.length - 1 || i === hover ? 5 : 3.2}
            fill={i === points.length - 1 ? color : "#fff"} stroke={i === points.length - 1 ? "#fff" : color} strokeWidth="2" />
        ))}
        {hover === null && (
          <text x={Math.min(X(last.date), w - R)} y={Y(last.v) - 12} textAnchor="end" fontSize="12" fontWeight="750" fill="var(--ink)">{last.v} {unit}</text>
        )}
        {h && <line x1={X(h.date)} x2={X(h.date)} y1={T} y2={H - B} stroke="rgba(42,11,28,.25)" strokeWidth="1" />}
      </svg>
      {h && (
        <div style={{ position: "absolute", top: 0, left: Math.max(0, Math.min(w - 130, X(h.date) - 65)), width: 130, pointerEvents: "none",
          background: "rgba(42,11,28,.88)", color: "#fff", borderRadius: 14, padding: "7px 10px", fontSize: 12, textAlign: "center",
          boxShadow: "0 10px 20px -10px rgba(42,11,28,.6)" }}>
          <div style={{ fontWeight: 750, fontSize: 15 }}>{h.v} {unit}</div>
          <div style={{ opacity: 0.75, textTransform: "capitalize" }}>J{diffDays(start, h.date) + 1} · {frDate(h.date, { day: "numeric", month: "short" })}</div>
        </div>
      )}
    </div>
  );
}
