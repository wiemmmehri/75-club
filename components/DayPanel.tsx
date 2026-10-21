"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Camera, Check, ChevronRight, Lock, Trash2 } from "lucide-react";
import { HeartsScene } from "./three";
import Sheet from "./Sheet";
import { useApp } from "./AppContext";
import { useToast } from "./Toast";
import { api, burst, buzz, compressImage, pick } from "@/lib/client";
import { sfx } from "@/lib/sound";
import { CAT, MOODS, type CatKey } from "@/lib/categories";

type Day = { date: string; checks: number[]; mood: string | null; note: string; water: number; photos: { id: number; mission: number }[] };

const CUSTOM_CHEERS = ["Coché. Tu es une machine (mignonne) ✨", "Petite victoire, grosse énergie 💪", "Ton futur toi applaudit 👏", "Discipline, mais en rose 🎀"];

function status(done: number, total: number) {
  if (total === 0) return "Aucun objectif ? Ajoute-en un dans ton profil, on t'attend 🌵";
  if (done === 0) return "Les cœurs attendent. Pas de pression (si, un peu).";
  if (done >= total) return `${total}/${total}. Main character, c'est toi.`;
  if (done === total - 1) return "Plus qu'un. Ne nous fais pas ça maintenant.";
  if (done * 2 >= total) return "Plus de la moitié. Elle arrive, on la sent.";
  return "Un cœur allumé. Le plus dur, c'est de commencer 💪";
}

export default function DayPanel({ date, dayNum, onChange, with3d = true }: { date: string; dayNum: number; onChange?: () => void; with3d?: boolean }) {
  const { goals } = useApp();
  const toast = useToast();
  const [day, setDay] = useState<Day | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shootFor, setShootFor] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [view, setView] = useState<{ id: number; mission: number } | null>(null);

  useEffect(() => {
    setDay(null);
    api<Day>(`/api/day?date=${date}`).then((d) => { setDay(d); setNote(d.note || ""); });
  }, [date]);

  const save = useCallback(async (body: Record<string, unknown>) => {
    const d = await api<Day>("/api/day", { body: { date, ...body } });
    onChange?.();
    return d;
  }, [date, onChange]);

  const ids = goals.map((g) => g.id);
  const NOTES: CatKey[] = ["sport", "diet", "quran", "selfcare"];

  async function toggle(id: number) {
    if (!day) return;
    await toggleOn(day, id);
  }

  async function toggleOn(day: Day, id: number) {
    const g = goals.find((x) => x.id === id);
    if (!g) return;
    const on = !day.checks.includes(id);
    const prev = day.checks;
    const next = on ? [...prev, id] : prev.filter((c) => c !== id);
    setDay({ ...day, checks: next });
    if (on) {
      sfx.check(NOTES[ids.indexOf(id) % 4]);
      buzz(18);
      if (ids.every((x) => next.includes(x))) {
        setTimeout(() => { sfx.complete(); burst(true); buzz([30, 60, 30, 60, 80]); }, 220);
        toast(`${ids.length}/${ids.length} 💗 Ta journée est validée, le club est prévenu`);
      } else {
        burst(false, { x: 0.5, y: 0.3 });
        toast(pick(g.category in CAT ? CAT[g.category as CatKey].cheers : CUSTOM_CHEERS));
      }
    } else {
      sfx.uncheck();
      buzz(6);
    }
    try { await save({ action: "toggle", mission: id, done: on }); }
    catch (e) { toast((e as Error).message); setDay((d) => (d ? { ...d, checks: prev } : d)); }
  }

  function shoot(id: number) {
    setShootFor(id);
    fileRef.current?.click();
  }

  /** Photo proofs for a goal: one request per photo, and the goal gets checked if it wasn't. */
  async function onPhotos(files: FileList | null) {
    const id = shootFor;
    if (!files?.length || id === null || !day) return;
    setUploading(id);
    let added = 0;
    try {
      for (const f of Array.from(files).slice(0, 4)) {
        await api("/api/check-photos", { body: { date, mission: id, data: await compressImage(f, 1000, 0.75) } });
        added++;
      }
    } catch (e) { toast((e as Error).message); }
    const fresh = await api<Day>(`/api/day?date=${date}`);
    setDay(fresh);
    setUploading(null);
    if (!added) return;
    sfx.win(); buzz(14);
    if (!fresh.checks.includes(id)) await toggleOn(fresh, id); // a proof = the goal is done
    else toast(added > 1 ? `${added} preuves ajoutées 📸 Le club voit tout` : "Preuve ajoutée 📸 Le club voit tout");
  }

  async function removePhoto(pid: number) {
    if (!day || !confirm("Supprimer cette preuve ?")) return;
    await api(`/api/check-photos/${pid}`, { method: "DELETE" });
    setDay({ ...day, photos: day.photos.filter((p) => p.id !== pid) });
    setView(null);
  }

  function onNote(v: string) {
    setNote(v);
    setSaved("Enregistrement…");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => { await save({ note: v }); setSaved("Enregistré ✓"); }, 700);
  }

  if (!day) return <div style={{ height: 560 }} />;
  const doneCount = day.checks.filter((c) => ids.includes(c)).length;

  return (
    <div>
      {with3d && (
        <div style={{ position: "relative", height: 300, margin: "0 -18px" }}>
          <HeartsScene goals={goals} done={day.checks} onTapHeart={toggle} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 4, textAlign: "center", pointerEvents: "none" }}>
            <span className="num" style={{ fontSize: 15, background: "rgba(255,255,255,.7)", backdropFilter: "blur(10px)", padding: "6px 12px", borderRadius: 99 }}>
              Jour {dayNum} · {doneCount}/{goals.length}
            </span>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.p key={doneCount} initial={{ opacity: 0, y: 6, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6 }}
          className="serif" style={{ textAlign: "center", fontSize: 22, margin: "14px 10px 18px", lineHeight: 1.15 }}>
          {status(doneCount, goals.length)}
        </motion.p>
      </AnimatePresence>

      <div className="stack">
        {goals.map((g) => {
          const base = g.category in CAT ? CAT[g.category as CatKey] : null;
          const c = { color: g.color, soft: base?.soft || `${g.color}2e`, label: base?.label || "Objectif perso", emoji: g.emoji };
          const on = day.checks.includes(g.id);
          const mine = day.photos.filter((p) => p.mission === g.id);
          return (
            <div key={g.id}>
              <div style={{ position: "relative" }}>
                <motion.button className="goal" onClick={() => toggle(g.id)} whileTap={{ scale: 0.97 }} aria-pressed={on}>
                  <motion.span className="glow" initial={false}
                    animate={{ opacity: on ? 1 : 0 }}
                    style={{ background: `linear-gradient(110deg, ${c.soft} 0%, rgba(255,255,255,.4) 100%)` }} />
                  <span className="gemo" style={{ background: on ? c.color : c.soft, boxShadow: on ? `0 8px 18px -8px ${c.color}` : "none", transition: "all .3s" }}>{c.emoji}</span>
                  <span className="gtxt">
                    <span className="gcat" style={{ color: c.color }}>{c.label}</span>
                    <span className="gtitle" style={{ opacity: on ? 0.55 : 1 }}>{g.title}</span>
                  </span>
                  <span style={{ width: 40, flex: "none" }} />
                  <span className="check" style={{ background: on ? c.color : undefined, boxShadow: on ? "none" : undefined }}>
                    <AnimatePresence>{on && <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} style={{ display: "grid", color: "#fff" }}><Check size={18} strokeWidth={3.2} /></motion.span>}</AnimatePresence>
                  </span>
                </motion.button>
                <motion.button type="button" className="cam-btn" whileTap={{ scale: 0.85 }} onClick={() => shoot(g.id)} aria-label={`Photo preuve pour ${g.title}`}
                  style={mine.length ? { background: c.color, color: "#fff" } : undefined}>
                  {uploading === g.id ? <span style={{ fontSize: 13 }}>⏳</span> : mine.length ? <span className="num" style={{ fontSize: 13 }}>{mine.length}</span> : <Camera size={16} />}
                </motion.button>
              </div>
              {mine.length > 0 && (
                <div className="proofs">
                  {mine.map((p) => (
                    <motion.button key={p.id} type="button" className="proof-thumb" onClick={() => setView(p)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <img src={`/api/check-photos/${p.id}`} alt="" loading="lazy" />
                    </motion.button>
                  ))}
                  {mine.length < 4 && (
                    <button type="button" className="proof-thumb" onClick={() => shoot(g.id)} aria-label="Ajouter une photo"
                      style={{ display: "grid", placeItems: "center", background: "rgba(255,255,255,.5)", color: c.color, boxShadow: `inset 0 0 0 1.5px ${c.color}55` }}>
                      <Camera size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
      <p className="tiny soft" style={{ textAlign: "center", margin: "10px 0 0" }}>📸 Touche l&apos;appareil photo pour prouver un objectif. Les photos sont visibles par le club.</p>

      {with3d && (
        <Link href="/body" className="dark" style={{ display: "block", marginTop: 22, padding: 18, textDecoration: "none", position: "relative", overflow: "hidden" }}>
          <motion.span aria-hidden animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: 4 }}
            style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,61,127,.6), transparent 70%)" }} />
          <div className="row" style={{ gap: 14, position: "relative" }}>
            <span style={{ width: 52, height: 52, borderRadius: 18, display: "grid", placeItems: "center", fontSize: 26, background: "rgba(255,255,255,.12)", flex: "none" }}>🪞</span>
            <span style={{ flex: 1 }}>
              <span className="tiny" style={{ color: "#ffb3cf", fontWeight: 700, letterSpacing: ".06em" }}>BODY JOURNAL</span>
              <span className="serif" style={{ display: "block", fontSize: 24, lineHeight: 1.05 }}>Poids, photos & <em>évolution</em></span>
              <span className="tiny" style={{ opacity: 0.7 }}>Privé · analyse de ta progression</span>
            </span>
            <ChevronRight size={20} style={{ opacity: 0.7 }} />
          </div>
        </Link>
      )}

      <div className="section">
        <h2 className="h2">Mood du jour</h2>
        <div className="moods">
          {MOODS.map((m) => (
            <motion.button key={m.key} whileTap={{ scale: 0.88 }} className={`mood ${day.mood === m.key ? "on" : ""}`}
              onClick={() => { const v = day.mood === m.key ? null : m.key; setDay({ ...day, mood: v }); save({ mood: v }); sfx.pop(); buzz(8); }}>
              <span className="m">{m.emoji}</span>{m.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 className="h2" style={{ margin: 0 }}>Hydratation</h2>
          <span className="pill">{day.water}/8 verres</span>
        </div>
        <div className="drops">
          {Array.from({ length: 8 }).map((_, i) => {
            const full = i < day.water;
            return (
              <motion.button key={i} className="drop" whileTap={{ scale: 0.8 }} aria-label={`${i + 1} verre(s)`}
                onClick={() => {
                  const v = day.water === i + 1 ? i : i + 1;
                  setDay({ ...day, water: v }); save({ water: v }); sfx.pop(); buzz(6);
                  if (v === 8) toast("8 verres 💧 Ta peau te dit merci");
                }}>
                <svg viewBox="0 0 24 32" width="100%" height="100%">
                  <defs><linearGradient id={`w${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe6ff" /><stop offset="1" stopColor="#7cc3ff" /></linearGradient></defs>
                  <path d="M12 1C12 1 2 13 2 20a10 10 0 0 0 20 0C22 13 12 1 12 1Z" fill={full ? `url(#w${i})` : "rgba(255,255,255,.7)"} stroke={full ? "#7cc3ff" : "rgba(42,11,28,.15)"} strokeWidth="1.2" />
                  {full && <ellipse cx="8.5" cy="18" rx="2" ry="3.4" fill="rgba(255,255,255,.7)" />}
                </svg>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 className="h2" style={{ margin: 0 }}>Journal privé</h2>
          <span className="tiny soft row" style={{ gap: 4 }}>{saved || <><Lock size={12} /> Visible par toi seule</>}</span>
        </div>
        <textarea className="textarea" value={note} onChange={(e) => onNote(e.target.value)}
          placeholder="Une victoire, un craquage, une pensée… personne d'autre ne lira ça 🤍" />
      </div>

      <Sheet open={!!view} onClose={() => setView(null)}>
        {view && (
          <div className="stack">
            <img src={`/api/check-photos/${view.id}`} alt="" style={{ borderRadius: 24, width: "100%" }} />
            <div className="row between">
              <b>{goals.find((g) => g.id === view.mission)?.emoji} {goals.find((g) => g.id === view.mission)?.title}</b>
              <button className="btn ghost sm" onClick={() => removePhoto(view.id)}><Trash2 size={14} /> Supprimer</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
