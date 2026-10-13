"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import Avatar from "@/components/Avatar";
import MiniHeart, { partsOf } from "@/components/MiniHeart";
import TeaFeed from "@/components/Feed";
import SoundToggle from "@/components/SoundToggle";
import { useApp } from "@/components/AppContext";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/client";
import { dayNumber, frDate, todayStr } from "@/lib/dates";

type Row = {
  id: number; name: string; email: string; emoji: string; color: string; avatarV: number; nickname: string | null; onboarded: boolean;
  photos: number; day: number; pct: number; streak: number; bestStreak: number; perfectDays: number; today: number[]; goals: { id: number; color: string }[]; lastActive: string | null;
};
const TABS = ["Les girls", "Tea", "Réglages"] as const;

export default function AdminPage() {
  const { me } = useApp();
  const toast = useToast();
  const today = todayStr();
  const [d, setD] = useState<{ start: string; users: Row[] } | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Les girls");
  const [start, setStart] = useState("");
  const load = useCallback(() => api<{ start: string; users: Row[] }>(`/api/admin/users?today=${today}`).then((r) => { setD(r); setStart(r.start); }), [today]);
  useEffect(() => { load(); }, [load]);

  const active = d?.users.filter((u) => u.onboarded) || [];
  const avg = active.length ? Math.round(active.reduce((s, u) => s + u.pct, 0) / active.length) : 0;
  const n = d ? dayNumber(d.start, today) : 0;

  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <div className="row between">
        <div>
          <p className="kicker">Espace fondatrice</p>
          <h1 className="title">Hello <em>{me.name}</em> {me.emoji}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <SoundToggle />
          <button className="icon-btn" aria-label="Déconnexion" onClick={async () => { await api("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}><LogOut size={17} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 20 }}>
        {[[n < 1 ? `J-${1 - n}` : `J${Math.min(n, 75)}`, "jour du club"], [`${avg}%`, "réussite moyenne"], [`${d?.users.filter((u) => u.goals.length > 0 && u.goals.every((g) => u.today.includes(g.id))).length || 0}/4`, "validées aujourd'hui"]].map(([v, l]) => (
          <div key={l} className="glass" style={{ padding: 14 }}><div className="num" style={{ fontSize: 28 }}>{v}</div><div className="tiny muted" style={{ fontWeight: 600 }}>{l}</div></div>
        ))}
      </div>

      <div className="row" style={{ gap: 6, marginTop: 22 }}>
        {TABS.map((t) => (
          <button key={t} className="pill" onClick={() => setTab(t)} style={{ border: 0, padding: "8px 14px", background: tab === t ? "var(--ink)" : undefined, color: tab === t ? "#fff" : undefined }}>{t}</button>
        ))}
      </div>

      {tab === "Les girls" && (
        <div className="stack section" style={{ marginTop: 16 }}>
          {d?.users.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={`/admin/${u.id}`} className="glass" style={{ display: "block", padding: 16, textDecoration: "none", color: "inherit" }}>
                <div className="row" style={{ gap: 12 }}>
                  <Avatar u={u} size={48} ring={u.goals.length ? u.today.filter((x) => u.goals.some((g) => g.id === x)).length / u.goals.length : 0} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>{u.name}</div>
                    <div className="tiny soft" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                  </div>
                  <MiniHeart parts={partsOf(u.goals, u.today)} size={38} />
                </div>
                <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>
                  {!u.onboarded ? <span className="pill" style={{ color: "var(--cherry)" }}>Pas encore connectée</span> : (
                    <>
                      <span className="pill">📈 {u.pct}%</span><span className="pill">🔥 {u.streak} (max {u.bestStreak})</span>
                      <span className="pill">💗 {u.perfectDays}</span><span className="pill">📸 {u.photos}</span>
                    </>
                  )}
                </div>
                {u.lastActive && <div className="tiny soft" style={{ marginTop: 8 }}>Dernière coche : {frDate(u.lastActive, { weekday: "short", day: "numeric", month: "short" })}</div>}
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "Tea" && <div style={{ marginTop: 16 }}><TeaFeed meId={me.id} isAdmin withComposer /></div>}

      {tab === "Réglages" && (
        <div className="glass pad stack" style={{ marginTop: 16 }}>
          <label className="label" htmlFor="sd">Jour 1 du challenge (pour tout le club)</label>
          <input id="sd" className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <button className="btn block" onClick={async () => { try { await api("/api/admin/settings", { method: "PUT", body: { start_date: start } }); toast("Date de départ enregistrée ✅"); load(); } catch (e) { toast((e as Error).message); } }}>
            Enregistrer la date
          </button>
          <p className="tiny soft" style={{ margin: 0 }}>Les comptes (email, mot de passe) se modifient en ouvrant la fiche de chaque fille.</p>
        </div>
      )}
    </main>
  );
}
