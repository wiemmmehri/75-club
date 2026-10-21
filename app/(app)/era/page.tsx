"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import DayPanel from "@/components/DayPanel";
import { HeroHeart } from "@/components/three";
import { useApp } from "@/components/AppContext";
import { api } from "@/lib/client";
import { dayNumber, todayStr } from "@/lib/dates";

export default function EraPage() {
  const { me, start } = useApp();
  const today = todayStr();
  const n = dayNumber(start, today);
  const [owed, setOwed] = useState<{ postId: number; text: string }[]>([]);
  const load = useCallback(() => api<{ owed: { postId: number; text: string }[] }>(`/api/wheel?today=${today}`).then((d) => setOwed(d.owed)).catch(() => {}), [today]);
  useEffect(() => {
    load();
    window.addEventListener("club75-wheel", load);
    return () => window.removeEventListener("club75-wheel", load);
  }, [load]);

  return (
    <main className="page">
      <TopBar />
      <p className="kicker">{me.nickname || "My era"}</p>
      <h1 className="title">My <em>era</em></h1>
      {me.era && <p className="serif muted" style={{ fontSize: 19, margin: "6px 0 0", fontStyle: "italic" }}>Current era : {me.era}</p>}

      {owed.map((o, i) => (
        <motion.div key={o.postId} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
          <Link href={`/tea#post-${o.postId}`} className="dark row" style={{ marginTop: 14, padding: 14, gap: 12, textDecoration: "none" }}>
            <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 1.2 }} style={{ fontSize: 30 }}>⚖️</motion.span>
            <span style={{ flex: 1 }}><b>Punition en attente</b><br /><span className="small" style={{ opacity: 0.8 }}>{o.text.replace(/^a tourné la roue 🎡 : /, "")} · poste ta preuve dans le Tea</span></span>
            <span className="pill" style={{ background: "var(--cherry-grad)", color: "#fff" }}>Prouver</span>
          </Link>
        </motion.div>
      ))}

      {n < 1 ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 260 }}><HeroHeart color={me.color} /></div>
          <h2 className="h2">Le club ouvre dans {1 - n} jour{1 - n > 1 ? "s" : ""}</h2>
          <p className="muted">Prépare ta photo Day 1 dans l&apos;Archive 📸</p>
          <Link href="/archive" className="btn">Aller à l&apos;Archive</Link>
        </div>
      ) : n > 75 ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 280 }}><HeroHeart color="#ffcf6b" /></div>
          <h2 className="title" style={{ fontSize: 40 }}>You <em>became her.</em></h2>
          <p className="muted" style={{ fontWeight: 500 }}>75 jours, c&apos;est fait. Va voir ton avant / après dans l&apos;Archive.</p>
          <Link href="/archive" className="btn">Voir mon glow-up</Link>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}><DayPanel date={today} dayNum={n} onChange={load} /></div>
      )}

    </main>
  );
}
