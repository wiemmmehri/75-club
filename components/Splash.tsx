"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SplashScene } from "./three";
import { sfx } from "@/lib/sound";
import { buzz } from "@/lib/client";

/** Opening ceremony, once per app launch: 4 hearts (the 4 girls) merge into one chrome heart. */
export default function Splash() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("club75-splash")) return;
    sessionStorage.setItem("club75-splash", "1");
    setShow(true);
    const a = setTimeout(() => setReady(true), 1900);
    const b = setTimeout(() => setShow(false), 5200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  function enter() {
    sfx.splash();
    buzz([10, 40, 20]);
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="overlay"
          style={{ background: "radial-gradient(120% 80% at 50% 35%, #ffe3ee 0%, #ff9cc4 45%, #d9134f 100%)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.15, filter: "blur(12px)" }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
          onClick={enter}
        >
          <div style={{ position: "absolute", inset: 0 }}><SplashScene /></div>
          <div style={{ position: "absolute", bottom: "calc(env(safe-area-inset-bottom,0px) + 70px)", left: 0, right: 0, textAlign: "center", color: "#fff" }}>
            <motion.div initial={{ y: 30, opacity: 0, filter: "blur(10px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} transition={{ delay: 1.4, duration: 0.8 }}>
              <div className="serif" style={{ fontSize: 58, lineHeight: 0.9, textShadow: "0 6px 30px rgba(120,0,40,.35)" }}>
                the <em>75</em> club
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 10, letterSpacing: "0.02em", opacity: 0.92 }}>
                Hajer, Wiem, Roua & Amani. One main character era.
              </div>
            </motion.div>
            <motion.div
              style={{ marginTop: 26, fontWeight: 600, fontSize: 13.5 }}
              initial={{ opacity: 0 }}
              animate={ready ? { opacity: [0.5, 1, 0.5] } : { opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              Touche pour entrer au club 🎀
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
