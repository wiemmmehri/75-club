"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import Avatar from "@/components/Avatar";
import { Badges } from "@/components/StatsBlocks";
import { useApp } from "@/components/AppContext";
import { api } from "@/lib/client";
import { frDate, todayStr } from "@/lib/dates";
import { EPISODES } from "@/lib/categories";
import type { Badge } from "@/lib/stats";

type U = { id: number; name: string; emoji: string; color: string; avatarV: number };
type Title = { key: string; emoji: string; title: string; desc: string; winners: number[]; score: number };
type Awards = { currentWeek: number; weeks: { week: number; from: string; to: string; titles: Title[] }[]; users: Record<string, U> };

export default function AwardsPage() {
  const { me } = useApp();
  const today = todayStr();
  const [a, setA] = useState<Awards | null>(null);
  const [badges, setBadges] = useState<Badge[] | null>(null);
  useEffect(() => {
    api<Awards>(`/api/awards?today=${today}`).then(setA);
    api<{ badges: Badge[] }>(`/api/progress?today=${today}`).then((p) => setBadges(p.badges));
  }, [today]);

  const cur = a?.weeks[a.weeks.length - 1];
  const past = a ? a.weeks.slice(0, -1).reverse() : [];
  const myCrowns = a ? a.weeks.flatMap((w) => w.titles).filter((t) => t.winners.includes(me.id)).length : 0;

  return (
    <main className="page">
      <TopBar />
      <h1 className="title">The <em>awards</em></h1>
      <p className="muted" style={{ fontWeight: 500, margin: "8px 0 0" }}>Plusieurs façons de gagner. Zéro drama (en théorie).</p>

      <div className="dark row" style={{ padding: 18, marginTop: 20, gap: 14 }}>
        <span style={{ fontSize: 40 }}>👑</span>
        <div><div className="num" style={{ fontSize: 34, lineHeight: 1 }}>{myCrowns}</div><div className="small" style={{ opacity: 0.8 }}>couronne{myCrowns > 1 ? "s" : ""} gagnée{myCrowns > 1 ? "s" : ""} depuis le début</div></div>
      </div>

      {cur && (
        <section className="section">
          <h2 className="h2">Cette semaine <em>· Ép. {cur.week + 1}</em></h2>
          <p className="small muted" style={{ marginTop: -6 }}>{EPISODES[cur.week]} — du {frDate(cur.from, { day: "numeric", month: "long" })} au {frDate(cur.to, { day: "numeric", month: "long" })}, en cours : tout peut encore bouger.</p>
          <div className="stack" style={{ marginTop: 12 }}>
            {cur.titles.map((t, i) => (
              <motion.div key={t.key} className="glass row" style={{ padding: 14, gap: 12 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <span style={{ fontSize: 30, width: 40, textAlign: "center" }}>{t.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  <div className="tiny muted">{t.desc}</div>
                </div>
                <div className="row" style={{ gap: -6 }}>
                  {t.winners.length === 0 ? <span className="tiny soft">À prendre</span> :
                    t.winners.map((w) => a!.users[w] && <span key={w} title={a!.users[w].name} style={{ marginLeft: -8 }}><Avatar u={a!.users[w]} size={36} /></span>)}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="h2">Mes badges</h2>
        {badges && <Badges list={badges} />}
      </section>

      <section className="section">
        <h2 className="h2">Hall of <em>fame</em></h2>
        {past.length === 0 ? <p className="small muted">Les gagnantes de chaque semaine apparaîtront ici à la fin de l&apos;épisode 1.</p> : (
          <div className="stack">
            {past.map((w) => (
              <div key={w.week} className="glass pad">
                <div style={{ fontWeight: 700 }}>Épisode {w.week + 1} <span className="serif" style={{ fontStyle: "italic", fontWeight: 400 }}>— {EPISODES[w.week]}</span></div>
                <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                  {w.titles.filter((t) => t.winners.length).map((t) => (
                    <span key={t.key} className="pill">{t.emoji} {t.winners.map((x) => a!.users[x]?.name).join(" & ")}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
