"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import HoloCard from "@/components/HoloCard";
import Garden from "@/components/Garden";
import Sheet from "@/components/Sheet";
import TeaFeed from "@/components/Feed";
import { Badges } from "@/components/StatsBlocks";
import { useApp } from "@/components/AppContext";
import { api } from "@/lib/client";
import { dayNumber, frDate, todayStr } from "@/lib/dates";
import type { Badge, Stats } from "@/lib/stats";

type G = {
  user: { id: number; name: string; emoji: string; color: string; avatarV: number; nickname: string | null; signature: string | null; era: string | null };
  goals: { id: number; category: string; title: string; emoji: string; color: string }[]; stats: Stats; tier: { key: string; label: string }; badges: Badge[]; start: string;
  proofs: { id: number; date: string; mission: number }[];
};

export default function GirlPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useApp();
  const today = todayStr();
  const [g, setG] = useState<G | null>(null);
  const [zoom, setZoom] = useState<{ id: number; date: string; mission: number } | null>(null);
  useEffect(() => { api<G>(`/api/girls/${id}?today=${today}`).then(setG); }, [id, today]);

  return (
    <main className="page">
      <Link href="/club" className="icon-btn" aria-label="Retour" style={{ marginBottom: 16 }}><ArrowLeft size={18} /></Link>
      {g && (
        <>
          <HoloCard u={g.user} tier={g.tier} stats={g.stats} number={g.user.id - 1} />
          <p className="tiny soft" style={{ textAlign: "center", marginTop: 10 }}>Fais glisser ton doigt sur la carte ✨ Elle devient plus rare avec les jours parfaits.</p>
          {g.user.era && <p className="serif" style={{ textAlign: "center", fontSize: 21, fontStyle: "italic", margin: "14px 0 0" }}>Current era : {g.user.era}</p>}

          <section className="section">
            <h2 className="h2">Her <em>missions</em></h2>
            <div className="stack" style={{ gap: 8 }}>
              {g.goals.map((m) => {
                const on = (g.stats.byDate[today] || []).includes(m.id);
                const pics = g.proofs.filter((x) => x.date === today && x.mission === m.id);
                return (
                  <div key={m.id} className="glass" style={{ padding: 12, background: on ? `${m.color}26` : undefined }}>
                    <div className="row" style={{ gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{m.emoji}</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{m.title}</span>
                      <span className="tiny" style={{ fontWeight: 700, color: on ? m.color : "var(--ink-3)" }}>{pics.length ? `📸 ${pics.length} · ` : ""}{on ? "fait aujourd'hui" : "en mission"}</span>
                    </div>
                    {pics.length > 0 && (
                      <div className="proofs">
                        {pics.map((x) => <button key={x.id} className="proof-thumb" onClick={() => setZoom(x)}><img src={`/api/check-photos/${x.id}`} alt="" loading="lazy" /></button>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {g.proofs.some((x) => x.date !== today) && (
            <section className="section">
              <h2 className="h2">Ses <em>preuves</em></h2>
              <div className="stack" style={{ gap: 10 }}>
                {Array.from(new Set(g.proofs.filter((x) => x.date !== today).map((x) => x.date))).slice(0, 10).map((d) => (
                  <div key={d} className="glass" style={{ padding: "12px 12px 10px" }}>
                    <div className="row between">
                      <b className="small">Jour {dayNumber(g.start, d)}</b>
                      <span className="tiny soft" style={{ textTransform: "capitalize" }}>{frDate(d, { weekday: "short", day: "numeric", month: "short" })}</span>
                    </div>
                    <div className="proofs">
                      {g.proofs.filter((x) => x.date === d).map((x) => (
                        <button key={x.id} className="proof-thumb" onClick={() => setZoom(x)}>
                          <img src={`/api/check-photos/${x.id}`} alt="" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <h2 className="h2">Son parcours</h2>
            <div className="glass pad"><Garden start={g.start} today={today} byDate={g.stats.byDate} goals={g.goals} /></div>
          </section>

          <section className="section"><h2 className="h2">Ses badges</h2><Badges list={g.badges} /></section>

          <section className="section">
            <h2 className="h2">Son <em>tea</em></h2>
            <TeaFeed meId={me.id} userId={g.user.id} withComposer={false} />
          </section>
        </>
      )}
      <Sheet open={!!zoom} onClose={() => setZoom(null)}>
        {zoom && g && (
          <div className="stack">
            <img src={`/api/check-photos/${zoom.id}`} alt="" style={{ borderRadius: 24, width: "100%" }} />
            <div className="row between">
              <b>{g.goals.find((m) => m.id === zoom.mission)?.emoji || "✨"} {g.goals.find((m) => m.id === zoom.mission)?.title || "Objectif"}</b>
              <span className="small muted">Jour {dayNumber(g.start, zoom.date)}</span>
            </div>
          </div>
        )}
      </Sheet>
    </main>
  );
}
