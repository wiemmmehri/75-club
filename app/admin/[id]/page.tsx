"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import HoloCard from "@/components/HoloCard";
import Garden from "@/components/Garden";
import PhotoGallery, { type PhotoMeta } from "@/components/PhotoGallery";
import { StatRow, CategoryBars, Badges } from "@/components/StatsBlocks";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/client";
import { todayStr } from "@/lib/dates";
import type { Badge, Stats } from "@/lib/stats";
import type { Goal, Me } from "@/components/AppContext";

type D = { user: Me; goals: Goal[]; progress: { start: string; stats: Stats; tier: { key: string; label: string }; badges: Badge[] }; photos: PhotoMeta[] };
const TABS = ["Parcours", "Photos", "Compte"] as const;

export default function AdminGirl() {
  const { id } = useParams<{ id: string }>();
  const today = todayStr();
  const toast = useToast();
  const [d, setD] = useState<D | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Parcours");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const load = useCallback(() => api<D>(`/api/admin/users/${id}?today=${today}`).then((r) => { setD(r); setF({ name: r.user.name, email: r.user.email, password: "" }); }), [id, today]);
  useEffect(() => { load(); }, [load]);

  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <Link href="/admin" className="icon-btn" aria-label="Retour" style={{ marginBottom: 16 }}><ArrowLeft size={18} /></Link>
      {d && (
        <>
          <HoloCard u={d.user} tier={d.progress.tier} stats={d.progress.stats} />
          <div className="row" style={{ gap: 6, marginTop: 20 }}>
            {TABS.map((t) => <button key={t} className="pill" onClick={() => setTab(t)} style={{ border: 0, padding: "8px 14px", background: tab === t ? "var(--ink)" : undefined, color: tab === t ? "#fff" : undefined }}>{t}</button>)}
          </div>
          {tab === "Parcours" && (
            <>
              <div className="section"><StatRow st={d.progress.stats} /></div>
              <section className="section">
                <h2 className="h2">Ses missions</h2>
                <div className="stack" style={{ gap: 8 }}>
                  {d.goals.map((m) => <div key={m.id} className="glass row" style={{ padding: 12, gap: 10 }}><span>{m.emoji}</span><b style={{ fontWeight: 600 }}>{m.title}</b></div>)}
                </div>
              </section>
              <section className="section"><h2 className="h2">Son parcours</h2><div className="glass pad"><Garden start={d.progress.start} today={today} byDate={d.progress.stats.byDate} goals={d.goals} /></div></section>
              <section className="section"><h2 className="h2">Par objectif</h2><CategoryBars st={d.progress.stats} goals={d.goals} /></section>
              <section className="section"><h2 className="h2">Badges</h2><Badges list={d.progress.badges} /></section>
            </>
          )}
          {tab === "Photos" && <PhotoGallery photos={d.photos} start={d.progress.start} />}
          {tab === "Compte" && (
            <div className="glass pad stack section">
              <div><label className="label">Prénom</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><label className="label">Email de connexion</label><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
              <div><label className="label">Nouveau mot de passe</label><input className="input" placeholder="Laisser vide pour ne pas changer" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
              <button className="btn block" onClick={async () => { try { await api(`/api/admin/users/${id}`, { method: "PUT", body: { ...f, password: f.password || undefined } }); toast("Compte mis à jour ✅"); load(); } catch (e) { toast((e as Error).message); } }}>Enregistrer</button>
              <p className="tiny soft" style={{ margin: 0 }}>Son journal reste privé, même pour toi 🤍</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
