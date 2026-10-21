"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Wheel from "./Wheel";
import { useApp } from "./AppContext";
import { api } from "@/lib/client";
import { dayNumber, frDate, todayStr } from "@/lib/dates";
import { WHEEL } from "@/lib/categories";

const INTROS = [
  "Le club ne pardonne pas. Mais il est mignon.",
  "On ne juge pas. On fait tourner la roue.",
  "Les règles sont les règles, chérie.",
  "Respire. Il y a des Free Pass dedans 🤞",
];

/**
 * Full-screen, no close button: if a day was missed, the wheel has to be spun before using the app.
 * Shows up again when the app comes back to the foreground.
 */
export default function WheelGate() {
  const { me, start } = useApp();
  const router = useRouter();
  const [pending, setPending] = useState<string[]>([]);
  const [result, setResult] = useState<{ index: number; postId: number } | null>(null);
  const [intro] = useState(() => INTROS[Math.floor(Math.random() * INTROS.length)]);
  const [total, setTotal] = useState(0);
  const active = me.role === "user" && !!me.onboarded;

  const check = useCallback(async () => {
    if (!active) return;
    try {
      const d = await api<{ pending: string[] }>(`/api/wheel?today=${todayStr()}`);
      setPending(d.pending);
      setTotal((t) => Math.max(t, d.pending.length));
    } catch {}
  }, [active]);

  useEffect(() => {
    check();
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [check]);

  const open = pending.length > 0 || result !== null;
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const date = pending[0];
  const w = result ? WHEEL[result.index] : null;
  const rest = pending.length - (result ? 1 : 0);

  function next(goProof: boolean) {
    const r = result;
    setResult(null);
    setPending((p) => p.slice(1));
    window.dispatchEvent(new Event("club75-wheel"));
    if (goProof && r) router.push(`/tea#post-${r.postId}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="gate" className="gate" role="dialog" aria-modal="true" aria-label="Roue des punitions"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="gate-inner">
            {!result && date && (
              <motion.div key={date} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
                <p className="kicker" style={{ color: "#ffb3cf", textAlign: "center" }}>
                  {total > 1 ? `Jour manqué ${total - pending.length + 1}/${total}` : "Jour manqué"}
                </p>
                <h2 className="title" style={{ color: "#fff", textAlign: "center", fontSize: 38 }}>
                  Jour {dayNumber(start, date)} n&apos;était <em>pas complet</em> 😬
                </h2>
                <p className="small" style={{ textAlign: "center", opacity: 0.75, margin: "10px 0 34px", textTransform: "none" }}>
                  <span style={{ textTransform: "capitalize" }}>{frDate(date)}</span> · {intro}
                </p>
                <Wheel key={date} date={date} today={todayStr()} onResult={(index, postId) => setResult({ index, postId })} />
                <p className="tiny" style={{ textAlign: "center", opacity: 0.55, marginTop: 18 }}>Impossible de fermer avant d&apos;avoir tourné. Le résultat part dans le Tea 👀</p>
              </motion.div>
            )}
            {w && result && (
              <motion.div key="res" initial={{ scale: 0.7, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }} style={{ textAlign: "center" }}>
                <p className="kicker" style={{ color: "#ffb3cf" }}>La roue a parlé</p>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.2 }} style={{ fontSize: 96, lineHeight: 1, margin: "18px 0" }}>{w.emoji}</motion.div>
                <h2 className="title" style={{ color: "#fff", fontSize: 44 }}>
                  {w.proof === "none" ? <em className="chrome-text">FREE PASS</em> : <em>{w.label}</em>}
                </h2>
                <p style={{ opacity: 0.85, lineHeight: 1.5, margin: "14px 8px 28px" }}>{w.hint}</p>
                {w.proof !== "none" && (
                  <div className="glass" style={{ padding: 14, marginBottom: 18, background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.15)", color: "#fff", textAlign: "left" }}>
                    <div className="small" style={{ fontWeight: 700 }}>⚖️ Le tribunal du club</div>
                    <div className="small" style={{ opacity: 0.8, marginTop: 4 }}>
                      Ta punition est affichée « en attente » dans le Tea jusqu&apos;à ce que tu postes ta preuve {w.proof === "voice" ? "(un vocal 🎙️)" : "(photo 📸 ou petit mot)"}. Les girls peuvent commenter.
                    </div>
                  </div>
                )}
                <div className="stack">
                  {w.proof !== "none" && <button className="btn block" onClick={() => next(true)}>Prouver maintenant {w.proof === "voice" ? "🎙️" : "📸"}</button>}
                  <button className={w.proof === "none" ? "btn block chrome" : "btn ghost block"} onClick={() => next(false)}>
                    {rest > 0 ? `Jour manqué suivant (${rest}) →` : w.proof === "none" ? "Merci la chance ✨" : "Je le fais plus tard"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
