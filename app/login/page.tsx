"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { HeroHeart } from "@/components/three";
import { api, buzz } from "@/lib/client";
import { sfx } from "@/lib/sound";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api<{ role: string; onboarded: boolean }>("/api/auth/login", { body: { email, password } });
      sfx.complete(); buzz([10, 40, 20]);
      setTimeout(() => { window.location.href = r.role === "admin" ? "/admin" : r.onboarded ? "/club" : "/onboarding"; }, 500);
    } catch (e) {
      setErr((e as Error).message); setBusy(false); sfx.uncheck(); buzz([30, 30, 30]);
    }
  }

  return (
    <main className="page" style={{ paddingBottom: 30, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 270, margin: "0 -18px" }}><HeroHeart /></div>
      <motion.div initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8 }}
        style={{ textAlign: "center", marginTop: -10 }}>
        <h1 className="title" style={{ fontSize: 60 }}>the <em style={{ color: "var(--cherry)" }}>75</em> club</h1>
        <p className="muted" style={{ fontWeight: 500, margin: "10px 0 26px" }}>Private club. Public glow-up.</p>
      </motion.div>

      <motion.form onSubmit={submit} className="glass" style={{ padding: 20 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="stack" style={{ gap: 14 }}>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@75club.app" />
          </div>
          <div>
            <label className="label" htmlFor="pw">Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input id="pw" className="input" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 50 }} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", color: "var(--ink-2)", display: "grid" }}>
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>
          {err && <motion.div className="error" animate={{ x: [10, -8, 5, 0] }}>{err}</motion.div>}
          <button className="btn block" disabled={busy}>{busy ? "Ouverture des portes…" : "Entrer au club"}</button>
        </div>
      </motion.form>
      <p className="small soft" style={{ textAlign: "center", marginTop: "auto", paddingTop: 22 }}>Mot de passe oublié ? Demande à la fondatrice 👑</p>
    </main>
  );
}
