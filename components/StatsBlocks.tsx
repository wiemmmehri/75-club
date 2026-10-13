"use client";
import { motion } from "framer-motion";
import type { Badge, Stats } from "@/lib/stats";

export function StatRow({ st }: { st: Stats }) {
  const items = [
    { v: st.streak, l: "jours parfaits d'affilée", e: "🔥" },
    { v: st.perfectDays, l: "journées parfaites", e: "💗" },
    { v: `${st.pct}%`, l: "de réussite", e: "📈" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {items.map((it, i) => (
        <motion.div key={i} className="glass" style={{ padding: "14px 12px" }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <div style={{ fontSize: 18 }}>{it.e}</div>
          <div className="num" style={{ fontSize: 30, marginTop: 4 }}>{it.v}</div>
          <div className="tiny muted" style={{ fontWeight: 600, lineHeight: 1.25 }}>{it.l}</div>
        </motion.div>
      ))}
    </div>
  );
}

export function CategoryBars({ st, goals }: { st: Stats; goals: { id: number; title: string; emoji: string; color: string }[] }) {
  const max = Math.max(1, st.elapsed);
  if (!goals.length) return <p className="small muted">Pas encore d&apos;objectif.</p>;
  return (
    <div className="glass pad stack" style={{ gap: 14 }}>
      {goals.map((g) => {
        const n = st.perGoal[g.id] || 0;
        return (
          <div key={g.id}>
            <div className="row between small" style={{ fontWeight: 600, marginBottom: 7, gap: 10 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.emoji} {g.title}</span><span className="num">{n}/{st.elapsed}</span>
            </div>
            <div className="bar"><motion.i style={{ background: `linear-gradient(90deg, ${g.color}55, ${g.color})` }}
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, (n / max) * 100)}%` }} transition={{ duration: 1, ease: "easeOut" }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function Badges({ list }: { list: Badge[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {list.map((b) => (
        <div key={b.key} className={`badge ${b.unlocked ? "" : "locked"}`}>
          <div className="bemo">{b.emoji}</div>
          <div className="small" style={{ fontWeight: 700, marginTop: 4 }}>{b.title}</div>
          <div className="tiny muted" style={{ marginTop: 2, lineHeight: 1.3 }}>{b.desc}</div>
        </div>
      ))}
    </div>
  );
}
