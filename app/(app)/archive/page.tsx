"use client";
import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Garden from "@/components/Garden";
import Sheet from "@/components/Sheet";
import DayPanel from "@/components/DayPanel";
import PhotoGallery, { type PhotoMeta } from "@/components/PhotoGallery";
import PhotoUpload from "@/components/PhotoUpload";
import { StatRow, CategoryBars } from "@/components/StatsBlocks";
import { useApp } from "@/components/AppContext";
import { api } from "@/lib/client";
import { addDays, frDate, todayStr } from "@/lib/dates";
import { EPISODES, MOODS } from "@/lib/categories";
import type { Stats } from "@/lib/stats";

type P = { start: string; stats: Stats; days: { date: string; mood: string | null; water: number }[] };

export default function ArchivePage() {
  const { me, start, goals } = useApp();
  const today = todayStr();
  const [p, setP] = useState<P | null>(null);
  const [photos, setPhotos] = useState<PhotoMeta[] | null>(null);
  const [pick, setPick] = useState<{ date: string; n: number } | null>(null);
  const load = useCallback(() => api<P>(`/api/progress?today=${today}`).then(setP), [today]);
  const loadPhotos = useCallback(() => api<{ photos: PhotoMeta[] }>("/api/photos").then((d) => setPhotos(d.photos)), []);
  useEffect(() => { load(); loadPhotos(); }, [load, loadPhotos]);

  const st = p?.stats;
  const weeks = st ? Math.min(11, Math.ceil(Math.max(1, st.elapsed) / 7)) : 0;
  const hasBefore = photos?.some((x) => x.kind === "before");

  return (
    <main className="page">
      <TopBar />
      <h1 className="title">The <em>archive</em></h1>
      <p className="muted" style={{ fontWeight: 500, margin: "8px 0 20px" }}>Ton film en 75 épisodes. Tout ce qui est ici est privé 🔒</p>

      {st && <StatRow st={st} />}

      <section className="section">
        <h2 className="h2">75 jours, 75 <em>cœurs</em></h2>
        <div className="glass pad">
          {st && <Garden start={start} today={today} byDate={st.byDate} goals={goals} onPick={(date, n) => setPick({ date, n })} />}
          <p className="tiny soft" style={{ textAlign: "center", margin: "12px 0 0" }}>Touche un jour passé pour le compléter ou le relire.</p>
        </div>
      </section>

      {st && st.elapsed > 0 && (
        <section className="section">
          <h2 className="h2">Mes <em>épisodes</em></h2>
          <div className="stack" style={{ gap: 10 }}>
            {Array.from({ length: weeks }).map((_, w) => {
              const days = Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)).filter((d) => d <= today);
              const perfect = days.filter((d) => st.perfectDates.includes(d)).length;
              const checks = days.reduce((s, d) => s + (st.byDate[d]?.length || 0), 0);
              const moods = days.map((d) => p!.days.find((x) => x.date === d)?.mood).filter(Boolean);
              return (
                <div key={w} className="glass row" style={{ padding: 14, gap: 12 }}>
                  <div className="num" style={{ fontSize: 26, width: 34, color: "var(--cherry)" }}>{String(w + 1).padStart(2, "0")}</div>
                  <div style={{ flex: 1 }}>
                    <div className="serif" style={{ fontSize: 19, fontStyle: "italic" }}>{EPISODES[w]}</div>
                    <div className="tiny muted">{perfect}/{days.length} jours parfaits · {checks} objectifs</div>
                  </div>
                  <div style={{ fontSize: 16 }}>{moods.slice(-3).map((m, i) => <span key={i}>{MOODS.find((x) => x.key === m)?.emoji}</span>)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {st && <section className="section"><h2 className="h2">Par objectif</h2><CategoryBars st={st} goals={goals} /></section>}

      <section className="section">
        <h2 className="h2">Glow-up <em>museum</em></h2>
        <div className="glass pad stack">
          {!hasBefore ? (
            <>
              <div style={{ fontWeight: 650 }}>Commence par ta photo Day 1 ✨</div>
              <p className="small muted" style={{ margin: 0 }}>Même pose, même lumière à chaque fois. La comparaison au jour 75 sera irréelle.</p>
              <PhotoUpload kind="before" date={start} label="Ajouter ma photo Day 1 📸" onDone={loadPhotos} />
            </>
          ) : (
            <>
              <PhotoUpload kind="progress" date={today} label="Ajouter une photo d'aujourd'hui 📸" onDone={loadPhotos} />
              <PhotoUpload kind="before" date={start} label="Remplacer ma photo Day 1" className="btn ghost sm" onDone={loadPhotos} />
            </>
          )}
        </div>
        {photos && <PhotoGallery photos={photos} start={start} onDelete={async (id) => { await api(`/api/photos/${id}`, { method: "DELETE" }); loadPhotos(); }} />}
      </section>

      {me.motivation && (
        <section className="section dark" style={{ padding: 22 }}>
          <div className="tiny" style={{ color: "#ffb3cf", fontWeight: 600 }}>Mon pourquoi</div>
          <p className="serif" style={{ fontSize: 24, fontStyle: "italic", margin: "8px 0 0", lineHeight: 1.2 }}>« {me.motivation} »</p>
        </section>
      )}

      <Sheet open={!!pick} onClose={() => setPick(null)}>
        {pick && (
          <>
            <p className="kicker" style={{ textAlign: "center", textTransform: "capitalize" }}>{frDate(pick.date)} · Jour {pick.n}</p>
            <DayPanel date={pick.date} dayNum={pick.n} onChange={load} with3d={false} />
          </>
        )}
      </Sheet>
    </main>
  );
}
