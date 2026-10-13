"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AppProvider, useApp } from "@/components/AppContext";
import ProfileFields, { type ProfileDraft } from "@/components/ProfileFields";
import GoalsForm, { draftFrom, starterDraft, toPayload, type GoalItem } from "@/components/GoalsForm";
import PhotoUpload from "@/components/PhotoUpload";
import { HeroHeart } from "@/components/three";
import { useToast } from "@/components/Toast";
import { api, burst } from "@/lib/client";
import { sfx } from "@/lib/sound";

export default function OnboardingPage() {
  return <AppProvider allowUnboarded><Onboarding /></AppProvider>;
}

function Onboarding() {
  const { me, goals, start, refresh } = useApp();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<ProfileDraft>({ name: me.name, emoji: me.emoji, nickname: me.nickname || "", signature: me.signature || "", era: me.era || "", color: me.color });
  const [draft, setDraft] = useState<GoalItem[]>(goals.length ? draftFrom(goals) : starterDraft());
  const [why, setWhy] = useState(me.motivation || "");
  const [photo, setPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const filled = toPayload(draft).length;

  async function next() {
    setBusy(true);
    try {
      if (step === 1) await api("/api/me", { method: "PUT", body: v });
      if (step === 2) await api("/api/goals", { method: "PUT", body: { goals: toPayload(draft) } });
      if (step === 3) await api("/api/me", { method: "PUT", body: { motivation: why } });
      if (step === 4) {
        await api("/api/me", { method: "PUT", body: { onboarded: true } });
        sfx.complete(); burst(true);
        await refresh();
        setTimeout(() => (window.location.href = "/club"), 1000);
        return;
      }
      sfx.whoosh();
      setStep(step + 1);
    } catch (e) { toast((e as Error).message); }
    finally { setBusy(false); }
  }

  const can = step === 1 ? !!v.name.trim() : step === 2 ? filled >= 1 : true;

  return (
    <main className="page" style={{ paddingBottom: 30, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="row" style={{ gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 9, background: i <= step ? "var(--cherry-grad)" : "rgba(42,11,28,.08)", transition: "background .4s" }} />
        ))}
      </div>
      <div style={{ flex: 1, marginTop: 22 }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 50, filter: "blur(6px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -50, filter: "blur(6px)" }} transition={{ duration: 0.35 }}>
            {step === 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ height: 260, margin: "0 -18px" }}><HeroHeart color={me.color} /></div>
                <p className="kicker">Invitation reçue</p>
                <h1 className="title" style={{ fontSize: 50 }}>Welcome to <em>the club,</em> {me.name}.</h1>
                <p className="muted" style={{ fontWeight: 500, lineHeight: 1.5, marginTop: 14 }}>
                  4 filles, 75 jours, une seule règle : on ne lâche personne. Prépare ta carte de membre, tes missions et ta photo Day 1.
                </p>
              </div>
            )}
            {step === 1 && (
              <div className="stack">
                <h1 className="title">Ta carte de <em>membre</em></h1>
                <div className="glass pad"><ProfileFields me={me} v={v} set={setV} onAvatar={refresh} /></div>
              </div>
            )}
            {step === 2 && (
              <div className="stack">
                <h1 className="title">Tes <em>missions</em></h1>
                <p className="muted" style={{ margin: 0, fontWeight: 500 }}>Remplis seulement celles que tu veux tenir (1 minimum, 6 maximum). Tu pourras les changer plus tard dans ton profil.</p>
                <GoalsForm value={draft} onChange={setDraft} />
              </div>
            )}
            {step === 3 && (
              <div className="stack">
                <h1 className="title">Ton <em>pourquoi</em></h1>
                <p className="muted" style={{ margin: 0, fontWeight: 500 }}>Privé. On te le rappellera les jours où tu voudras abandonner.</p>
                <textarea className="textarea" style={{ minHeight: 160 }} value={why} maxLength={400} onChange={(e) => setWhy(e.target.value)} placeholder="Je fais ce challenge parce que…" />
              </div>
            )}
            {step === 4 && (
              <div className="stack">
                <h1 className="title">Ta photo <em>Day 1</em></h1>
                <p className="muted" style={{ margin: 0, fontWeight: 500 }}>Privée : visible par toi seule (et la fondatrice). Au jour 75, tu glisseras le curseur et tu ne te reconnaîtras pas.</p>
                <div className="glass pad stack" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 56 }}>{photo ? "✅" : "🪞"}</div>
                  {photo ? <b>Photo enregistrée. Iconique.</b> : <PhotoUpload kind="before" date={start} label="Prendre ou choisir ma photo" onDone={() => setPhoto(true)} />}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="row" style={{ gap: 10, marginTop: 22 }}>
        {step > 0 && <button className="icon-btn" onClick={() => setStep(step - 1)} aria-label="Retour"><ArrowLeft size={18} /></button>}
        <button className="btn block" style={{ flex: 1 }} disabled={!can || busy} onClick={next}>
          {step === 0 ? "Accepter l'invitation 💌" : step === 4 ? (photo ? "Entrer au club 🎀" : "Plus tard, entrer au club 🎀") : "Continuer"}
        </button>
      </div>
    </main>
  );
}
