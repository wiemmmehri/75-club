"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { WHEEL } from "@/lib/categories";
import { api, burst, buzz } from "@/lib/client";
import { sfx } from "@/lib/sound";

/** The Consequence Wheel 🎡 — the server picks, the wheel performs. */
export default function Wheel({ date, onDone }: { date: string; onDone?: (label: string) => void }) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const ticks = useRef<ReturnType<typeof setTimeout>[]>([]);
  const n = WHEEL.length, seg = 360 / n;

  async function spin() {
    if (spinning || result !== null) return;
    setErr("");
    try {
      setSpinning(true);
      const { index } = await api<{ index: number }>("/api/wheel", { body: { date } });
      const target = 360 * 6 + (360 - (index * seg + seg / 2));
      setRot(target);
      // ticking that slows down like a real wheel
      let t = 0;
      for (let i = 0; i < 40; i++) {
        t += 30 + i * i * 0.9;
        if (t > 4200) break;
        ticks.current.push(setTimeout(() => { sfx.tick(); buzz(4); }, t));
      }
      setTimeout(() => {
        setSpinning(false);
        setResult(index);
        sfx.win();
        burst(false);
        onDone?.(WHEEL[index].label);
      }, 4500);
    } catch (e) {
      setSpinning(false);
      setErr((e as Error).message);
    }
  }

  const grad = WHEEL.map((w, i) => `${w.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(", ");

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 290, height: 290, margin: "0 auto" }}>
        <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", zIndex: 2, fontSize: 30, filter: "drop-shadow(0 4px 6px rgba(80,10,40,.4))" }}>🔻</div>
        <motion.div
          animate={{ rotate: rot }}
          transition={{ duration: 4.4, ease: [0.12, 0.7, 0.12, 1] }}
          style={{ width: "100%", height: "100%", borderRadius: "50%", background: `conic-gradient(${grad})`, position: "relative",
            boxShadow: "0 20px 40px -16px rgba(120,10,50,.5), inset 0 0 0 6px rgba(255,255,255,.9)" }}
        >
          {WHEEL.map((w, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, transform: `rotate(${i * seg + seg / 2}deg)` }}>
              <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 70, textAlign: "center", fontSize: 10, fontWeight: 700, lineHeight: 1.15 }}>
                <div style={{ fontSize: 22 }}>{w.emoji}</div>
                {w.label.length > 22 ? w.label.slice(0, 20) + "…" : w.label}
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", inset: "38%", borderRadius: "50%", background: "var(--cherry-grad)", boxShadow: "inset 0 2px 0 rgba(255,255,255,.5)" }} />
        </motion.div>
      </div>
      {result === null ? (
        <button className="btn" style={{ marginTop: 22 }} onClick={spin} disabled={spinning}>
          {spinning ? "Ça tourne…" : "Tourner la roue 🎡"}
        </button>
      ) : (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass pad" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 34 }}>{WHEEL[result].emoji}</div>
          <div className="serif" style={{ fontSize: 26 }}>{WHEEL[result].label}</div>
          <p className="small muted" style={{ margin: "6px 0 0" }}>Le résultat a été posté dans le Tea. Le club veille 👀</p>
        </motion.div>
      )}
      {err && <div className="error" style={{ marginTop: 14 }}>{err}</div>}
    </div>
  );
}
