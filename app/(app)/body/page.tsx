"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion } from "framer-motion";
import { ArrowLeft, Camera, Lock, Pause, Play, Settings2, Trash2 } from "lucide-react";
import Compare from "@/components/Compare";
import Sheet from "@/components/Sheet";
import WeightChart from "@/components/WeightChart";
import { useApp } from "@/components/AppContext";
import { useToast } from "@/components/Toast";
import { api, burst, buzz, compressImage } from "@/lib/client";
import { sfx } from "@/lib/sound";
import { addDays, dayNumber, diffDays, frDate, todayStr } from "@/lib/dates";
import { CHALLENGE_DAYS } from "@/lib/categories";

type Log = { date: string; weight: number | null; waist: number | null; hips: number | null; chest: number | null; arm: number | null; thigh: number | null; note: string | null };
type Photo = { id: number; date: string; pose: Pose };
type Pose = "front" | "side" | "back";
type Data = { start: string; profile: { height: number | null; goal: number | null }; logs: Log[]; photos: Photo[] };

const POSES: { key: Pose; label: string; emoji: string }[] = [
  { key: "front", label: "Face", emoji: "🧍‍♀️" },
  { key: "side", label: "Profil", emoji: "🚶‍♀️" },
  { key: "back", label: "Dos", emoji: "🙆‍♀️" },
];
const MEASURES = [
  { key: "waist", label: "Taille", emoji: "⏳" },
  { key: "hips", label: "Hanches", emoji: "🍑" },
  { key: "chest", label: "Poitrine", emoji: "🎀" },
  { key: "arm", label: "Bras", emoji: "💪" },
  { key: "thigh", label: "Cuisse", emoji: "🦵" },
] as const;
type MKey = (typeof MEASURES)[number]["key"];

const r1 = (n: number) => Math.round(n * 10) / 10;
const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(r1(n)).toLocaleString("fr-FR");

/** Least squares slope in kg/day. */
function slope(pts: { date: string; v: number }[]) {
  if (pts.length < 2) return 0;
  const x = pts.map((p) => diffDays(pts[0].date, p.date)), y = pts.map((p) => p.v);
  const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
  let num = 0, den = 0;
  x.forEach((xi, i) => { num += (xi - mx) * (y[i] - my); den += (xi - mx) ** 2; });
  return den ? num / den : 0;
}

function CountUp({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toFixed(decimals).replace(".", ","); } });
    prev.current = value;
    return () => c.stop();
  }, [value, decimals]);
  return <span ref={ref}>{value.toFixed(decimals).replace(".", ",")}</span>;
}

export default function BodyPage() {
  const { me } = useApp();
  const toast = useToast();
  const today = todayStr();
  const [d, setD] = useState<Data | null>(null);
  const [date, setDate] = useState(today);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showM, setShowM] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [prof, setProf] = useState({ height: "", goal: "" });
  const [pose, setPose] = useState<Pose>("front");
  const [mode, setMode] = useState<"slider" | "ghost" | "side">("slider");
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const [ghost, setGhost] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [range, setRange] = useState<"14" | "all">("all");
  const [zoom, setZoom] = useState<Photo | null>(null);
  const shotRef = useRef<HTMLInputElement>(null);
  const shotPose = useRef<Pose>("front");

  const load = useCallback(() => api<Data>("/api/body").then((r) => { setD(r); setProf({ height: r.profile.height?.toString() || "", goal: r.profile.goal?.toString() || "" }); return r; }), []);
  useEffect(() => { load(); }, [load]);

  // fill the form with the selected day (or yesterday's weight as a starting point)
  useEffect(() => {
    if (!d) return;
    const log = d.logs.find((l) => l.date === date);
    const prevW = [...d.logs].reverse().find((l) => l.date < date && l.weight)?.weight;
    const f: Record<string, string> = { weight: log?.weight?.toString() || prevW?.toString() || "", note: log?.note || "" };
    MEASURES.forEach((m) => { f[m.key] = log?.[m.key]?.toString() || ""; });
    setForm(f);
    if (MEASURES.some((m) => log?.[m.key])) setShowM(true);
  }, [d, date]);

  const weights = useMemo(() => (d?.logs || []).filter((l) => l.weight).map((l) => ({ date: l.date, v: Number(l.weight) })), [d]);
  const posePhotos = useMemo(() => (d?.photos || []).filter((p) => p.pose === pose), [d, pose]);

  useEffect(() => {
    setA(posePhotos[0]?.id ?? null);
    setB(posePhotos[posePhotos.length - 1]?.id ?? null);
    setFrame(0); setPlaying(false);
  }, [posePhotos]);

  useEffect(() => {
    if (!playing || posePhotos.length < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % posePhotos.length), 650);
    return () => clearInterval(t);
  }, [playing, posePhotos.length]);

  // ——— analysis ———
  const an = useMemo(() => {
    if (!d || weights.length === 0) return null;
    const first = weights[0], last = weights[weights.length - 1];
    const delta = last.v - first.v;
    const recent = weights.filter((p) => diffDays(p.date, last.date) <= 14);
    const perWeek = slope(recent.length >= 3 ? recent : weights) * 7;
    const end = addDays(d.start, CHALLENGE_DAYS - 1);
    const canProject = weights.length >= 3 && diffDays(first.date, last.date) >= 5 && last.date < end;
    const projected = canProject ? last.v + (perWeek / 7) * diffDays(last.date, end) : null;
    const goal = d.profile.goal;
    const goalPct = goal && first.v !== goal ? Math.max(0, Math.min(1, (first.v - last.v) / (first.v - goal))) : null;
    const h = d.profile.height;
    const bmi = h ? last.v / (h / 100) ** 2 : null;
    const elapsed = Math.max(1, Math.min(CHALLENGE_DAYS, dayNumber(d.start, today)));
    const loggedDays = d.logs.filter((l) => l.date >= d.start).length;
    const lowest = Math.min(...weights.map((p) => p.v));
    const measures = MEASURES.map((m) => {
      const s = d.logs.filter((l) => l[m.key]).map((l) => Number(l[m.key]));
      return { ...m, first: s[0], last: s[s.length - 1], delta: s.length > 1 ? s[s.length - 1] - s[0] : null };
    }).filter((m) => m.first);
    const totalCm = measures.reduce((s, m) => s + (m.delta || 0), 0);
    return { first, last, delta, perWeek, projected, goal, goalPct, bmi, elapsed, loggedDays, lowest, measures, totalCm, end };
  }, [d, weights, today]);

  const insights = useMemo(() => {
    if (!an || !d) return [];
    const out: { e: string; bg: string; t: string; s: string }[] = [];
    const losing = !an.goal || an.goal < an.first.v;
    if (weights.length < 3) out.push({ e: "🌱", bg: "#C9F2E2", t: "Encore quelques pesées", s: "Dès 3 pesées sur une semaine, l'analyse (rythme, projection jour 75) se débloque. Pèse-toi le matin, à jeun, même balance." });
    else {
      const w = an.perWeek;
      if (Math.abs(w) < 0.1) out.push({ e: "🧘‍♀️", bg: "#E3DAFF", t: "Plateau, et c'est normal", s: "Ton poids est stable ces derniers jours. Souvent les mensurations et les photos bougent avant la balance, regarde plus bas 👇" });
      else if (losing && w < -1.1) out.push({ e: "🤍", bg: "#FFD3E2", t: `Rythme rapide : ${sign(w)} kg/sem`, s: "Plus d'1 kg par semaine, c'est beaucoup. Mange assez, dors bien, hydrate-toi. On veut un glow-up durable, pas une fatigue." });
      else if (losing && w < 0) out.push({ e: "🔥", bg: "#FFE2C9", t: `Rythme parfait : ${sign(w)} kg/sem`, s: "Entre 0,25 et 1 kg par semaine, c'est le rythme qui tient dans le temps. Continue exactement comme ça." });
      else if (losing && w > 0) out.push({ e: "🌊", bg: "#C9F2E2", t: `Petite remontée : ${sign(w)} kg/sem`, s: "Eau, sel, cycle, muscles… 1 à 2 kg de variation c'est normal. Regarde la tendance sur 2 semaines, pas un seul jour." });
      else out.push({ e: "💪", bg: "#FFE2C9", t: `Tendance : ${sign(w)} kg/sem`, s: an.goal && an.goal > an.first.v ? "Tu prends dans la bonne direction. Protéines + sommeil = combo gagnant." : "Ta courbe bouge, garde le cap." });
    }
    if (an.projected !== null && an.last.date < an.end) out.push({ e: "🔮", bg: "#E3DAFF", t: `Jour 75 : environ ${r1(an.projected).toLocaleString("fr-FR")} kg`, s: `Si tu gardes ce rythme jusqu'au ${frDate(an.end, { day: "numeric", month: "long" })}. ${an.goal ? (Math.abs(an.projected - an.goal) < 0.5 ? "Pile sur ton objectif 🎯" : losing === an.projected > an.goal ? "Encore un petit effort pour l'objectif." : "Objectif dépassé, wow 👑") : "Ajoute un objectif dans ⚙️ pour comparer."}` });
    if (an.measures.some((m) => m.delta !== null)) out.push({ e: "📏", bg: "#FFF1C7", t: `${sign(an.totalCm)} cm au total`, s: an.measures.filter((m) => m.delta).map((m) => `${m.label} ${sign(m.delta!)} cm`).join(" · ") });
    const reg = Math.round((an.loggedDays / an.elapsed) * 100);
    out.push({ e: reg >= 70 ? "🏅" : "📅", bg: "#FFD3E2", t: `Régularité : ${Math.min(100, reg)} %`, s: reg >= 70 ? `${an.loggedDays} check-ins sur ${an.elapsed} jours. Discipline de reine.` : `${an.loggedDays} check-ins sur ${an.elapsed} jours. Une pesée tous les 2-3 jours suffit pour une belle courbe.` });
    const pc = d.photos.length;
    out.push({ e: "📸", bg: "#E3DAFF", t: pc ? `${pc} photo${pc > 1 ? "s" : ""} dans ton miroir` : "Pas encore de photo", s: pc >= 2 ? "Fais glisser le comparateur : c'est là que le glow-up se voit vraiment." : "Même pose, même lumière, même endroit. Une par semaine minimum." });
    return out;
  }, [an, d, weights.length]);

  async function save() {
    setSaving(true);
    try {
      const wasLowest = an?.lowest;
      await api("/api/body", { body: { date, ...form } });
      const w = Number(form.weight);
      const fresh = await load();
      const losing = !fresh.profile.goal || (an ? fresh.profile.goal < an.first.v : true);
      if (w && wasLowest && losing && w < wasLowest) { sfx.complete(); burst(true); toast(`Nouveau record : ${w} kg 🎉`); }
      else { sfx.win(); burst(false); toast("Check-in enregistré 🪞"); }
      buzz(14);
    } catch (e) { toast((e as Error).message); }
    finally { setSaving(false); }
  }

  async function onShot(f?: File) {
    if (!f) return;
    try {
      toast("Envoi de la photo…");
      await api("/api/body/photos", { body: { date, pose: shotPose.current, data: await compressImage(f, 1200, 0.8) } });
      sfx.win(); burst(false); buzz(12);
      toast("Photo ajoutée à ton miroir 📸");
      load();
    } catch (e) { toast((e as Error).message); }
  }

  const step = (k: string, by: number) => {
    const v = Number(form[k] || an?.last.v || 60);
    setForm({ ...form, [k]: r1(Math.max(0, v + by)).toString() });
    buzz(4); sfx.tap();
  };

  if (!d) return <main className="page" />;
  const n = dayNumber(d.start, today);
  const dayPhotos = d.photos.filter((p) => p.date === date);
  const ph = (id: number | null) => (id ? `/api/body/photos/${id}` : "");
  const pa = posePhotos.find((p) => p.id === a), pb = posePhotos.find((p) => p.id === b);
  const chartPts = range === "14" ? weights.filter((p) => diffDays(p.date, today) <= 14) : weights;
  const R = 54, C = 2 * Math.PI * R;

  return (
    <main className="page">
      <div className="row between" style={{ marginBottom: 16 }}>
        <Link href="/era" className="icon-btn" aria-label="Retour"><ArrowLeft size={18} /></Link>
        <span className="pill"><Lock size={12} /> Privé, rien que pour toi</span>
        <button className="icon-btn" aria-label="Réglages" onClick={() => setProfileOpen(true)}><Settings2 size={18} /></button>
      </div>
      <p className="kicker">{n >= 1 && n <= CHALLENGE_DAYS ? `Jour ${n} · ` : ""}Body journal</p>
      <h1 className="title">Mirror, <em>mirror</em></h1>

      {/* ——— hero ——— */}
      <motion.section className="dark" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginTop: 18, padding: 20, position: "relative", overflow: "hidden" }}>
        <motion.span aria-hidden animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 9 }}
          style={{ position: "absolute", left: -60, bottom: -80, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${me.color}88, transparent 70%)` }} />
        {an ? (
          <div className="row" style={{ gap: 18, position: "relative" }}>
            <div style={{ position: "relative", width: R * 2 + 12, height: R * 2 + 12, flex: "none" }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${R * 2 + 12} ${R * 2 + 12}`} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={R + 6} cy={R + 6} r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
                <motion.circle cx={R + 6} cy={R + 6} r={R} fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C}
                  initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - (an.goalPct ?? Math.min(1, an.elapsed / CHALLENGE_DAYS))) }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }} />
                <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd0e2" /><stop offset="1" stopColor="#ff3d7f" /></linearGradient></defs>
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                <div>
                  <div className="num" style={{ fontSize: 22 }}>{Math.round((an.goalPct ?? Math.min(1, an.elapsed / CHALLENGE_DAYS)) * 100)}%</div>
                  <div className="tiny" style={{ opacity: 0.7 }}>{an.goalPct !== null ? "objectif" : "challenge"}</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="tiny" style={{ color: "#ffb3cf", fontWeight: 700, letterSpacing: ".06em" }}>AUJOURD&apos;HUI</div>
              <div className="num" style={{ fontSize: 46, lineHeight: 1 }}><CountUp value={an.last.v} /><span style={{ fontSize: 18, opacity: 0.7 }}> kg</span></div>
              <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                <span className="pill" style={{ background: "rgba(255,255,255,.14)", color: "#fff", boxShadow: "none" }}>{sign(an.delta)} kg depuis J{dayNumber(d.start, an.first.date)}</span>
                {an.bmi && <span className="pill" style={{ background: "rgba(255,255,255,.14)", color: "#fff", boxShadow: "none" }}>IMC {r1(an.bmi).toLocaleString("fr-FR")}</span>}
                {an.goal && <span className="pill" style={{ background: "rgba(255,255,255,.14)", color: "#fff", boxShadow: "none" }}>🎯 {an.goal} kg</span>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 40 }}>🪞</div>
            <div className="serif" style={{ fontSize: 28, lineHeight: 1.05, marginTop: 6 }}>Ton premier check-in <em>commence ici</em></div>
            <p className="small" style={{ opacity: 0.75, margin: "8px 0 0" }}>Poids, mensurations et 3 photos. Dans 75 jours tu vas te remercier.</p>
          </div>
        )}
      </motion.section>

      {/* ——— check-in ——— */}
      <section className="section">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 className="h2" style={{ margin: 0 }}>Check-in <em>du jour</em></h2>
          <input type="date" className="pill" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ border: 0 }} />
        </div>
        <div className="glass pad stack">
          <label className="label" style={{ margin: 0, textAlign: "center" }}>Poids (kg)</label>
          <div className="stepper">
            <button type="button" onClick={() => step("weight", -0.1)} aria-label="Moins 100 g">−</button>
            <input inputMode="decimal" value={form.weight || ""} placeholder="—" onChange={(e) => setForm({ ...form, weight: e.target.value.replace(",", ".") })} aria-label="Poids" />
            <button type="button" onClick={() => step("weight", 0.1)} aria-label="Plus 100 g">+</button>
          </div>
          {an && form.weight && Number(form.weight) > 0 && date === today && (
            <div className="tiny" style={{ textAlign: "center", fontWeight: 650, color: "var(--ink-2)" }}>
              {sign(Number(form.weight) - an.first.v)} kg depuis le début
            </div>
          )}

          <button type="button" className="btn ghost sm" onClick={() => setShowM(!showM)}>📏 {showM ? "Masquer" : "Ajouter"} les mensurations (cm)</button>
          <AnimatePresence>
            {showM && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {MEASURES.map((m) => {
                    const prev = an?.measures.find((x) => x.key === m.key);
                    return (
                      <div key={m.key}>
                        <label className="label" style={{ fontSize: 12 }}>{m.emoji} {m.label}{prev?.first ? <span className="soft"> · départ {prev.first}</span> : null}</label>
                        <input className="input" inputMode="decimal" value={form[m.key] || ""} placeholder="cm" onChange={(e) => setForm({ ...form, [m.key]: e.target.value.replace(",", ".") })} />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="label">Photos du jour <span className="soft">· même pose, même lumière</span></label>
            <div className="pose-grid">
              {POSES.map((p) => {
                const ex = dayPhotos.find((x) => x.pose === p.key);
                return (
                  <motion.button key={p.key} type="button" className="pose" whileTap={{ scale: 0.95 }}
                    onClick={() => { if (ex) setZoom(ex); else { shotPose.current = p.key; shotRef.current?.click(); } }}>
                    {ex ? <img src={ph(ex.id)} alt={p.label} /> : (
                      <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
                        <div style={{ fontSize: 34, opacity: 0.55 }}>{p.emoji}</div>
                        <Camera size={16} style={{ marginTop: 4 }} />
                      </div>
                    )}
                    <span>{p.label}</span>
                  </motion.button>
                );
              })}
            </div>
            <input ref={shotRef} type="file" accept="image/*" hidden onChange={(e) => { onShot(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          <textarea className="textarea" style={{ minHeight: 60 }} placeholder="Comment tu te sens dans ton corps aujourd'hui ? 🤍" value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button className="btn block" onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer mon check-in ✨"}</button>
        </div>
      </section>

      {/* ——— chart ——— */}
      {weights.length > 0 && (
        <section className="section">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 className="h2" style={{ margin: 0 }}>Ta <em>courbe</em></h2>
            <div className="seg">
              <button className={range === "14" ? "on" : ""} onClick={() => setRange("14")}>14 j</button>
              <button className={range === "all" ? "on" : ""} onClick={() => setRange("all")}>Tout</button>
            </div>
          </div>
          <div className="glass" style={{ padding: "16px 12px 10px" }}>
            {chartPts.length > 0 ? <WeightChart points={chartPts} goal={d.profile.goal} start={d.start} /> : <p className="small muted" style={{ textAlign: "center" }}>Pas de pesée ces 14 derniers jours.</p>}
            <p className="tiny soft" style={{ textAlign: "center", margin: "6px 0 0" }}>Glisse ton doigt sur la courbe 👆</p>
          </div>
        </section>
      )}

      {/* ——— insights ——— */}
      {insights.length > 0 && (
        <section className="section">
          <h2 className="h2">L&apos;analyse <em>du coach</em></h2>
          <div className="stack" style={{ gap: 8 }}>
            {insights.map((x, i) => (
              <motion.div key={x.t} className="insight" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <span className="ie" style={{ background: x.bg }}>{x.e}</span>
                <div><div style={{ fontWeight: 700 }}>{x.t}</div><div className="small muted" style={{ marginTop: 2, lineHeight: 1.4 }}>{x.s}</div></div>
              </motion.div>
            ))}
          </div>
          {an && an.measures.length > 0 && (
            <div className="glass pad" style={{ marginTop: 10 }}>
              <div className="small" style={{ fontWeight: 700, marginBottom: 10 }}>Mensurations : départ → maintenant</div>
              <div className="stack" style={{ gap: 10 }}>
                {an.measures.map((m) => {
                  const pct = m.first ? Math.max(0.05, Math.min(1, m.last / m.first)) : 1;
                  return (
                    <div key={m.key}>
                      <div className="row between small"><span>{m.emoji} {m.label}</span><b className="num">{m.first} → {m.last} cm {m.delta ? <span style={{ color: "var(--ink-2)" }}>({sign(m.delta)})</span> : null}</b></div>
                      <div className="bar" style={{ marginTop: 5 }}><motion.i initial={{ width: 0 }} whileInView={{ width: `${pct * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} style={{ background: "var(--cherry-grad)" }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ——— mirror studio ——— */}
      {d.photos.length > 0 && (
        <section className="section">
          <h2 className="h2">Le <em>miroir</em></h2>
          <div className="row between wrap" style={{ gap: 8, marginBottom: 12 }}>
            <div className="seg">{POSES.map((p) => <button key={p.key} className={pose === p.key ? "on" : ""} onClick={() => setPose(p.key)}>{p.label}</button>)}</div>
            <div className="seg">
              {([["slider", "↔"], ["ghost", "👻"], ["side", "▯▯"]] as const).map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)} aria-label={k}>{l}</button>)}
            </div>
          </div>
          {posePhotos.length === 0 ? (
            <div className="glass pad" style={{ textAlign: "center" }}><p className="muted small" style={{ margin: 0 }}>Pas encore de photo « {POSES.find((p) => p.key === pose)?.label} ».</p></div>
          ) : posePhotos.length === 1 ? (
            <div className="compare"><img src={ph(posePhotos[0].id)} alt="" /><span className="tag" style={{ left: 10 }}>J{dayNumber(d.start, posePhotos[0].date)}</span></div>
          ) : (
            <>
              <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                {[[a, setA, "Avant"], [b, setB, "Après"]].map(([val, set, l]) => (
                  <select key={l as string} className="input" style={{ padding: "10px 12px", fontSize: 14 }} value={(val as number) ?? ""} onChange={(e) => (set as (n: number) => void)(Number(e.target.value))} aria-label={l as string}>
                    {posePhotos.map((p) => <option key={p.id} value={p.id}>{l as string} · J{dayNumber(d.start, p.date)} ({frDate(p.date, { day: "numeric", month: "short" })})</option>)}
                  </select>
                ))}
              </div>
              {pa && pb && mode === "slider" && <Compare before={ph(pa.id)} after={ph(pb.id)} beforeLabel={`J${dayNumber(d.start, pa.date)}`} afterLabel={`J${dayNumber(d.start, pb.date)}`} />}
              {pa && pb && mode === "ghost" && (
                <>
                  <div className="compare">
                    <img src={ph(pa.id)} alt="" />
                    <img src={ph(pb.id)} alt="" style={{ opacity: ghost / 100 }} />
                    <span className="tag" style={{ left: 10 }}>J{dayNumber(d.start, pa.date)}</span>
                    <span className="tag" style={{ right: 10 }}>J{dayNumber(d.start, pb.date)}</span>
                  </div>
                  <input type="range" min={0} max={100} value={ghost} onChange={(e) => setGhost(Number(e.target.value))} style={{ width: "100%", marginTop: 12, accentColor: "var(--hot)" }} aria-label="Transparence" />
                  <p className="tiny soft" style={{ textAlign: "center", margin: 0 }}>Mode fantôme : superpose les deux photos pour voir chaque centimètre 👻</p>
                </>
              )}
              {pa && pb && mode === "side" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[pa, pb].map((p) => (
                    <div key={p.id} className="compare"><img src={ph(p.id)} alt="" /><span className="tag" style={{ left: 8 }}>J{dayNumber(d.start, p.date)}</span></div>
                  ))}
                </div>
              )}

              <div className="dark" style={{ marginTop: 16, padding: 14 }}>
                <div className="row between" style={{ marginBottom: 10 }}>
                  <div><b>Timelapse</b><div className="tiny" style={{ opacity: 0.7 }}>{posePhotos.length} photos · ton film en accéléré</div></div>
                  <button className="icon-btn" onClick={() => { setPlaying(!playing); sfx.tap(); }} aria-label={playing ? "Pause" : "Lecture"} style={{ background: "var(--cherry-grad)", color: "#fff" }}>
                    {playing ? <Pause size={17} fill="#fff" /> : <Play size={17} fill="#fff" style={{ marginLeft: 2 }} />}
                  </button>
                </div>
                <div className="compare" style={{ boxShadow: "none" }}>
                  {posePhotos.map((p, i) => <img key={p.id} src={ph(p.id)} alt="" style={{ opacity: i === frame ? 1 : 0, transition: "opacity .3s" }} />)}
                  <span className="tag" style={{ left: 10, color: "var(--ink)" }}>Jour {dayNumber(d.start, posePhotos[frame]?.date || d.start)}</span>
                </div>
                <div className="row" style={{ gap: 3, marginTop: 10 }}>
                  {posePhotos.map((p, i) => <button key={p.id} onClick={() => { setFrame(i); setPlaying(false); }} aria-label={`Photo ${i + 1}`} style={{ flex: 1, height: 4, border: 0, padding: 0, borderRadius: 4, background: i <= frame ? "#ff7fa8" : "rgba(255,255,255,.2)" }} />)}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* ——— timeline (table view) ——— */}
      {d.logs.length > 0 && (
        <section className="section">
          <h2 className="h2">Historique</h2>
          <div className="glass" style={{ padding: 6 }}>
            {[...d.logs].reverse().map((l, i, arr) => {
              const prev = arr[i + 1]?.weight;
              const dd = l.weight && prev ? Number(l.weight) - Number(prev) : null;
              const pics = d.photos.filter((p) => p.date === l.date);
              return (
                <button key={l.date} onClick={() => { setDate(l.date); window.scrollTo({ top: 300, behavior: "smooth" }); }}
                  className="row" style={{ width: "100%", border: 0, background: l.date === date ? "rgba(255,255,255,.8)" : "none", borderRadius: 20, padding: "10px 12px", textAlign: "left", gap: 10 }}>
                  <span className="num" style={{ width: 38, color: "var(--cherry)", fontSize: 14 }}>J{dayNumber(d.start, l.date)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 650 }}>{l.weight ? `${l.weight} kg` : "—"}</span>
                    {dd !== null && <span className="tiny" style={{ marginLeft: 6, color: "var(--ink-2)", fontWeight: 650 }}>{sign(dd)}</span>}
                    <span className="tiny soft" style={{ display: "block", textTransform: "capitalize" }}>{frDate(l.date, { weekday: "short", day: "numeric", month: "short" })}{l.note ? ` · ${l.note.slice(0, 40)}` : ""}</span>
                  </span>
                  {pics.length > 0 && <span className="tiny">📸 {pics.length}</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <Sheet open={profileOpen} onClose={() => setProfileOpen(false)}>
        <h2 className="h2" style={{ textAlign: "center" }}>Ton <em>profil</em> body</h2>
        <div className="stack">
          <div><label className="label">Taille (cm)</label><input className="input" inputMode="decimal" value={prof.height} onChange={(e) => setProf({ ...prof, height: e.target.value.replace(",", ".") })} placeholder="ex : 165" /></div>
          <div><label className="label">Objectif de poids (kg) — optionnel</label><input className="input" inputMode="decimal" value={prof.goal} onChange={(e) => setProf({ ...prof, goal: e.target.value.replace(",", ".") })} placeholder="ex : 58" /></div>
          <p className="tiny soft" style={{ margin: 0 }}>Tout reste privé : ni les girls ni l&apos;admin ne voient ton body journal 🔒</p>
          <button className="btn block" onClick={async () => { try { await api("/api/body", { body: { action: "profile", ...prof } }); setProfileOpen(false); toast("Profil enregistré ✨"); load(); } catch (e) { toast((e as Error).message); } }}>Enregistrer</button>
        </div>
      </Sheet>

      <Sheet open={!!zoom} onClose={() => setZoom(null)}>
        {zoom && (
          <div className="stack">
            <img src={ph(zoom.id)} alt="" style={{ borderRadius: 24, width: "100%" }} />
            <div className="row between">
              <div><b>{POSES.find((p) => p.key === zoom.pose)?.label} · Jour {dayNumber(d.start, zoom.date)}</b><div className="small muted" style={{ textTransform: "capitalize" }}>{frDate(zoom.date)}</div></div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn ghost sm" onClick={() => { shotPose.current = zoom.pose; setZoom(null); shotRef.current?.click(); }}><Camera size={14} /></button>
                <button className="btn ghost sm" onClick={async () => { if (!confirm("Supprimer cette photo ?")) return; await api(`/api/body/photos/${zoom.id}`, { method: "DELETE" }); setZoom(null); load(); }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </main>
  );
}
