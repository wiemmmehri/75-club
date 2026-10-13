"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import DayPanel from "@/components/DayPanel";
import Sheet from "@/components/Sheet";
import Wheel from "@/components/Wheel";
import { HeroHeart } from "@/components/three";
import { useApp } from "@/components/AppContext";
import { api } from "@/lib/client";
import { dayNumber, todayStr } from "@/lib/dates";

export default function EraPage() {
  const { me, start } = useApp();
  const today = todayStr();
  const n = dayNumber(start, today);
  const [missed, setMissed] = useState<{ missedYesterday: boolean; yesterday: string; stats: { streak: number } } | null>(null);
  const [wheel, setWheel] = useState(false);
  const load = useCallback(() => api(`/api/progress?today=${today}`).then(setMissed), [today]);
  useEffect(() => { load(); }, [load]);

  return (
    <main className="page">
      <TopBar />
      <p className="kicker">{me.nickname || "My era"}</p>
      <h1 className="title">My <em>era</em></h1>
      {me.era && <p className="serif muted" style={{ fontSize: 19, margin: "6px 0 0", fontStyle: "italic" }}>Current era : {me.era}</p>}

      {missed?.missedYesterday && n > 1 && n <= 76 && (
        <motion.button className="dark row" onClick={() => setWheel(true)} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ marginTop: 18, padding: 14, gap: 12, width: "100%", border: 0, textAlign: "left" }}>
          <span style={{ fontSize: 30 }}>🎡</span>
          <span style={{ flex: 1 }}><b>Hier n&apos;était pas complet…</b><br /><span className="small" style={{ opacity: 0.8 }}>La roue des conséquences t&apos;attend. Il y a des Free Pass 🤞</span></span>
        </motion.button>
      )}

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

      <Sheet open={wheel} onClose={() => { setWheel(false); load(); }}>
        <h2 className="h2" style={{ textAlign: "center" }}>The consequence <em>wheel</em></h2>
        <p className="small muted" style={{ textAlign: "center", marginTop: -4 }}>Des conséquences mignonnes, jamais méchantes. Le résultat part dans le Tea.</p>
        {missed && <Wheel date={missed.yesterday} />}
      </Sheet>
    </main>
  );
}
