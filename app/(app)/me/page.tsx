"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import ProfileFields, { type ProfileDraft } from "@/components/ProfileFields";
import GoalsForm, { draftFrom, toPayload, type GoalItem } from "@/components/GoalsForm";
import SoundToggle from "@/components/SoundToggle";
import { useApp } from "@/components/AppContext";
import { useToast } from "@/components/Toast";
import { api, burst } from "@/lib/client";
import { sfx } from "@/lib/sound";

export default function MePage() {
  const { me, goals, refresh } = useApp();
  const toast = useToast();
  const [v, setV] = useState<ProfileDraft>({ name: me.name, emoji: me.emoji, nickname: me.nickname || "", signature: me.signature || "", era: me.era || "", color: me.color });
  const [why, setWhy] = useState(me.motivation || "");
  const [draft, setDraft] = useState<GoalItem[]>(draftFrom(goals));
  const [pw, setPw] = useState({ current: "", next: "" });

  const ok = (m: string) => { toast(m); sfx.win(); burst(false); };
  const fail = (e: unknown) => toast((e as Error).message);

  return (
    <main className="page">
      <div className="row between" style={{ marginBottom: 16 }}>
        <Link href="/club" className="icon-btn" aria-label="Retour"><ArrowLeft size={18} /></Link>
        <SoundToggle />
      </div>
      <h1 className="title">Mon <em>profil</em></h1>
      <Link href={`/girls/${me.id}`} className="pill" style={{ marginTop: 10, textDecoration: "none", color: "inherit" }}>Voir ma carte de membre ✨</Link>

      <section className="section glass pad">
        <ProfileFields me={me} v={v} set={setV} onAvatar={refresh} />
        <div style={{ marginTop: 16 }}>
          <label className="label" htmlFor="why">Mon pourquoi (privé)</label>
          <textarea id="why" className="textarea" value={why} maxLength={400} onChange={(e) => setWhy(e.target.value)} placeholder="Ce qui te fera tenir les jours difficiles…" />
        </div>
        <button className="btn block" style={{ marginTop: 16 }}
          onClick={async () => { try { await api("/api/me", { method: "PUT", body: { ...v, motivation: why } }); await refresh(); ok("Profil mis à jour 💅"); } catch (e) { fail(e); } }}>
          Enregistrer mon profil
        </button>
      </section>

      <section className="section">
        <h2 className="h2">Mes <em>missions</em></h2>
        <GoalsForm value={draft} onChange={setDraft} />
        <button className="btn block" style={{ marginTop: 14 }}
          onClick={async () => { try { await api("/api/goals", { method: "PUT", body: { goals: toPayload(draft) } }); const fresh = await api<{ goals: typeof goals }>("/api/me"); setDraft(draftFrom(fresh.goals)); await refresh(); ok("Missions enregistrées 🎯"); } catch (e) { fail(e); } }}>
          Enregistrer mes missions
        </button>
      </section>

      <section className="section glass pad stack">
        <h2 className="h2" style={{ margin: 0 }}>Mot de passe</h2>
        <input className="input" type="password" placeholder="Mot de passe actuel" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        <input className="input" type="password" placeholder="Nouveau (6 caractères min.)" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <button className="btn ghost block" disabled={!pw.current || pw.next.length < 6}
          onClick={async () => { try { await api("/api/password", { body: pw }); setPw({ current: "", next: "" }); ok("Nouveau mot de passe enregistré 🔐"); } catch (e) { fail(e); } }}>
          Changer mon mot de passe
        </button>
      </section>

      <section className="section stack">
        <button className="btn ghost block" onClick={async () => { await api("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}><LogOut size={16} /> Me déconnecter</button>
        <p className="tiny soft" style={{ textAlign: "center" }}>Installer l&apos;app : sur iPhone, Partager puis « Sur l&apos;écran d&apos;accueil ». Sur Android, menu puis « Installer l&apos;application ».</p>
      </section>
    </main>
  );
}
