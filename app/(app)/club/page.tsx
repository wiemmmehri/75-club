"use client";
import { useCallback, useEffect, useState } from "react";

const SEEN_KEY = "club75-sos-seen";
const seenSos = (): number[] => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch { return []; } };
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Siren } from "lucide-react";
import TopBar from "@/components/TopBar";
import Avatar from "@/components/Avatar";
import MiniHeart, { partsOf } from "@/components/MiniHeart";
import Milestone from "@/components/Milestone";
import { PostCard, type Post } from "@/components/Feed";
import { useApp } from "@/components/AppContext";
import { api, avatarUrl } from "@/lib/client";
import { dayNumber, frDate, todayStr } from "@/lib/dates";
import { DAILY_LINES, EPISODES } from "@/lib/categories";

type Girl = {
  id: number; name: string; emoji: string; color: string; avatarV: number; nickname: string | null; me: boolean;
  signature: string | null; era: string | null; today: number[]; goals: { id: number; color: string }[]; pct: number; streak: number; perfectDays: number;
};
type Club = { start: string; girls: Girl[]; sos: Post[]; latest: Post[] };

const TILT = [-3, 2.5, 2, -2.5];

export default function ClubPage() {
  const { me } = useApp();
  const today = todayStr();
  const [c, setC] = useState<Club | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  useEffect(() => setSeen(seenSos()), []);
  const load = useCallback(() => api<Club>(`/api/club?today=${today}`).then(setC), [today]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  if (!c) return <main className="page"><TopBar /></main>;
  const n = dayNumber(c.start, today);
  const ep = Math.min(10, Math.max(0, Math.floor((n - 1) / 7)));
  const isDone = (g: Girl) => g.goals.length > 0 && g.goals.every((x) => g.today.includes(x.id));
  const done = c.girls.filter(isDone).length;
  const line = DAILY_LINES[(n + 75) % DAILY_LINES.length];
  const meGirl = c.girls.find((g) => g.me);

  return (
    <main className="page">
      <TopBar />
      {n >= 1 && n <= 75 && <Milestone day={n} />}

      {/* hero: the day */}
      <section>
        <p className="kicker" style={{ textTransform: "capitalize" }}>{frDate(today)}</p>
        {n < 1 ? (
          <h1 className="title" style={{ fontSize: 52 }}>Le club ouvre <em>dans {1 - n} jour{1 - n > 1 ? "s" : ""}</em></h1>
        ) : n > 75 ? (
          <h1 className="title" style={{ fontSize: 52 }}>The girls <em>we became.</em></h1>
        ) : (
          <>
            <div className="row" style={{ alignItems: "flex-end", gap: 10 }}>
              <motion.span className="num chrome-text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 112, lineHeight: 0.85, backgroundImage: "linear-gradient(115deg,#d9134f,#ff6fa3 30%,#a98bff 55%,#ff3d7f 80%,#d9134f)" }}>
                {n}
              </motion.span>
              <div style={{ paddingBottom: 8 }}>
                <div className="num muted" style={{ fontSize: 22 }}>/75</div>
                <div className="serif" style={{ fontSize: 20, lineHeight: 1.05 }}>Épisode {ep + 1}<br /><em>{EPISODES[ep]}</em></div>
              </div>
            </div>
            <div className="bar" style={{ marginTop: 14, height: 6 }}>
              <motion.i initial={{ width: 0 }} animate={{ width: `${(n / 75) * 100}%` }} transition={{ duration: 1.2 }} style={{ background: "var(--cherry-grad)" }} />
            </div>
          </>
        )}
      </section>

      {/* SOS banners */}
      {c.sos.filter((p) => p.user.id !== me.id && !seen.includes(p.id)
        && !Object.values(p.reactions).some((u) => u.includes(me.id)) && !p.comments.some((x) => x.user.id === me.id)).map((p) => (
        <motion.div key={p.id} className="dark row" style={{ padding: 14, marginTop: 18, gap: 12 }} animate={{ scale: [1, 1.015, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <Siren color="#ff7aa8" />
          <div style={{ flex: 1 }}><b>{p.user.name}</b> a lancé un SOS. Envoie-lui de la force 💗</div>
          <Link href={`/tea#post-${p.id}`} className="btn sm" onClick={() => { const s = [...seenSos(), p.id]; localStorage.setItem(SEEN_KEY, JSON.stringify(s)); setSeen(s); }}>Y aller</Link>
        </motion.div>
      ))}

      {/* the four */}
      <section className="section">
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="h2" style={{ margin: 0 }}>The four <em>it-girls</em></h2>
          <span className="pill">{done}/4 ont validé</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {c.girls.map((g, i) => {
            const src = avatarUrl(g);
            const fin = isDone(g);
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: TILT[i % 4] }}
                transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 160, damping: 16 }} whileTap={{ scale: 0.95, rotate: 0 }}>
                <Link href={`/girls/${g.id}`} className="polaroid">
                  <div className="ph" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${g.color}66)` }}>
                    {src ? <img src={src} alt={g.name} /> : <span>{g.emoji}</span>}
                    {fin && <span className="pill" style={{ position: "absolute", top: 6, right: 6, background: "var(--cherry-grad)", color: "#fff" }}>Validé ✓</span>}
                    <span style={{ position: "absolute", bottom: 6, left: 6 }}><MiniHeart parts={partsOf(g.goals, g.today)} size={30} /></span>
                  </div>
                  <div style={{ padding: "8px 2px 0" }}>
                    <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>{g.name}{g.me ? " (toi)" : ""}</div>
                    <div className="tiny muted" style={{ fontWeight: 600, marginTop: 3 }}>{g.nickname}</div>
                    <div className="row tiny" style={{ gap: 8, marginTop: 6, fontWeight: 650 }}>
                      <span>🔥 {g.streak}</span><span>📈 {g.pct}%</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* daily line */}
      <section className="section dark" style={{ padding: 22 }}>
        <div className="tiny" style={{ fontWeight: 600, color: "#ffb3cf" }}>Le mot du club</div>
        <p className="serif" style={{ fontSize: 28, lineHeight: 1.1, margin: "8px 0 16px" }}><em>{line}</em></p>
        {meGirl && (
          <Link href="/era" className="btn chrome block">
            {isDone(meGirl) ? "Revoir ma journée 💗" : `Enter your era ✨ (${meGirl.today.filter((x) => meGirl.goals.some((m) => m.id === x)).length}/${meGirl.goals.length})`}
          </Link>
        )}
      </section>

      {/* latest tea */}
      <section className="section">
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="h2" style={{ margin: 0 }}>Fresh <em>tea</em> ☕</h2>
          <Link href="/tea" className="pill" style={{ textDecoration: "none", color: "inherit" }}>Tout voir <ArrowRight size={13} /></Link>
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {c.latest.length === 0 && <p className="muted small">Rien encore. Va servir le premier thé.</p>}
          {c.latest.map((p) => <PostCard key={p.id} p={p} meId={me.id} onChange={load} />)}
        </div>
      </section>
    </main>
  );
}
