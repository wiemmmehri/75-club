"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { WHEEL } from "@/lib/categories";
import { api, burst, buzz } from "@/lib/client";
import { sfx } from "@/lib/sound";

/** The Punishment Wheel 🎡 — the server picks, the wheel performs. */
export default function Wheel({ date, today, onResult, size = 300 }: {
  date: string; today: string; size?: number; onResult?: (index: number, postId: number) => void;
}) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [lit, setLit] = useState(0);
  const ticks = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pointer = useAnimationControls();
  const n = WHEEL.length, seg = 360 / n;

  // chasing rim lights, faster while spinning
  useEffect(() => {
    const t = setInterval(() => setLit((x) => x + 1), spinning ? 70 : 380);
    return () => clearInterval(t);
  }, [spinning]);
  useEffect(() => () => ticks.current.forEach(clearTimeout), []);

  async function spin() {
    if (spinning || done) return;
    setErr("");
    try {
      setSpinning(true);
      sfx.whoosh();
      const { index, postId } = await api<{ index: number; postId: number }>("/api/wheel", { body: { date, today } });
      const jitter = (Math.random() - 0.5) * seg * 0.6;
      setRot(360 * 7 + (360 - (index * seg + seg / 2)) + jitter);
      let t = 0;
      for (let i = 0; i < 46; i++) {
        t += 28 + i * i * 0.85;
        if (t > 4600) break;
        ticks.current.push(setTimeout(() => {
          sfx.tick(); buzz(4);
          pointer.start({ rotate: [0, -18, 0], transition: { duration: 0.12 } });
        }, t));
      }
      ticks.current.push(setTimeout(() => {
        setSpinning(false);
        setDone(true);
        WHEEL[index].proof === "none" ? (sfx.complete(), burst(true)) : (sfx.win(), burst(false));
        buzz([40, 60, 40]);
        onResult?.(index, postId);
      }, 5000));
    } catch (e) {
      setSpinning(false);
      setErr((e as Error).message);
    }
  }

  const grad = WHEEL.map((w, i) => `${w.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(", ");
  const BULBS = 24;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        {/* rim with chasing bulbs */}
        <div style={{ position: "absolute", inset: -14, borderRadius: "50%", background: "radial-gradient(circle, #4a1230 60%, #2a0b1c 100%)",
          boxShadow: "0 30px 60px -20px rgba(120,10,50,.7), inset 0 0 0 2px rgba(255,255,255,.15)" }}>
          {Array.from({ length: BULBS }).map((_, i) => {
            const on = (i + lit) % 3 === 0;
            const a = (i / BULBS) * Math.PI * 2;
            const r = size / 2 + 7;
            return <span key={i} style={{ position: "absolute", left: size / 2 + 14 + Math.cos(a) * r - 4, top: size / 2 + 14 + Math.sin(a) * r - 4,
              width: 8, height: 8, borderRadius: "50%", background: on ? "#fff3b0" : "#7a3a55",
              boxShadow: on ? "0 0 10px 3px rgba(255,230,140,.9)" : "none", transition: "all .12s" }} />;
          })}
        </div>
        <motion.div animate={pointer} style={{ position: "absolute", top: -26, left: "50%", marginLeft: -16, zIndex: 3, transformOrigin: "50% 20%", width: 32 }}>
          <svg width="32" height="42" viewBox="0 0 32 42"><path d="M16 42 L2 10 A14 14 0 1 1 30 10 Z" fill="url(#pg)" stroke="#fff" strokeWidth="2.5" /><circle cx="16" cy="13" r="5" fill="#fff" />
            <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff5c97" /><stop offset="1" stopColor="#a80d3c" /></linearGradient></defs></svg>
        </motion.div>
        <motion.div
          animate={{ rotate: rot }}
          transition={{ duration: 4.9, ease: [0.1, 0.72, 0.1, 1] }}
          style={{ width: "100%", height: "100%", borderRadius: "50%", background: `conic-gradient(${grad})`, position: "relative",
            boxShadow: "inset 0 0 0 5px rgba(255,255,255,.95), inset 0 0 40px rgba(120,10,50,.18)" }}
        >
          {WHEEL.map((_, i) => (
            <div key={`l${i}`} style={{ position: "absolute", left: "50%", top: 0, width: 2, height: "50%", marginLeft: -1, background: "rgba(255,255,255,.95)", transformOrigin: "50% 100%", transform: `rotate(${i * seg}deg)` }} />
          ))}
          {WHEEL.map((w, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, transform: `rotate(${i * seg + seg / 2}deg)` }}>
              <div style={{ position: "absolute", top: size * 0.06, left: "50%", transform: "translateX(-50%)", width: size * 0.24, textAlign: "center", fontSize: 10, fontWeight: 750, lineHeight: 1.1, color: "#2a0b1c" }}>
                <div style={{ fontSize: size * 0.085 }}>{w.emoji}</div>
                {w.label}
              </div>
            </div>
          ))}
        </motion.div>
        <button onClick={spin} disabled={spinning || done} aria-label="Tourner la roue"
          style={{ position: "absolute", inset: "37%", borderRadius: "50%", border: 0, background: "var(--cherry-grad)", color: "#fff", zIndex: 2,
            fontWeight: 800, fontSize: size * 0.05, letterSpacing: ".04em",
            boxShadow: "0 10px 24px -8px rgba(120,10,50,.8), inset 0 2px 0 rgba(255,255,255,.5), 0 0 0 5px rgba(255,255,255,.9)" }}>
          {spinning ? "🎲" : done ? "🎯" : "SPIN"}
        </button>
      </div>
      {!done && (
        <button className="btn" style={{ marginTop: 30, minWidth: 220 }} onClick={spin} disabled={spinning}>
          {spinning ? "Ça tourne… 🤞" : "Tourner la roue 🎡"}
        </button>
      )}
      {err && <div className="error" style={{ marginTop: 14 }}>{err}</div>}
    </div>
  );
}
