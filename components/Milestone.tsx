"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MILESTONES } from "@/lib/categories";
import { burst } from "@/lib/client";
import { sfx } from "@/lib/sound";

/** Full-screen celebration on days 7, 15, 30, 50 and 75 — shown once per milestone. */
export default function Milestone({ day }: { day: number }) {
  const [open, setOpen] = useState(false);
  const m = MILESTONES[day];
  useEffect(() => {
    if (!m) return;
    const key = `club75-milestone-${day}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const t = setTimeout(() => { setOpen(true); burst(true); sfx.fanfare(); }, 900);
    return () => clearTimeout(t);
  }, [day, m]);
  if (!m) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" onClick={() => setOpen(false)}
          style={{ background: "radial-gradient(100% 70% at 50% 40%, rgba(255,214,230,.97), rgba(217,19,79,.97))", padding: 30 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.6, rotateX: 40 }} animate={{ scale: 1, rotateX: 0 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}
            style={{ textAlign: "center", color: "#fff" }}>
            <div className="num" style={{ fontSize: 140, lineHeight: 0.9, textShadow: "0 10px 40px rgba(120,0,40,.4)" }}>{day}</div>
            <div className="serif" style={{ fontSize: 46, marginTop: 8 }}><em>{m.title}</em></div>
            <p style={{ fontWeight: 600, fontSize: 16, maxWidth: 300, margin: "14px auto 26px", lineHeight: 1.45 }}>{m.text}</p>
            <button className="btn chrome">Continuer à briller ✨</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
