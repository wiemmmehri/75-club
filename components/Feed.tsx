"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Send, Trash2, X, MessageCircle, Siren } from "lucide-react";
import Avatar from "./Avatar";
import { useToast } from "./Toast";
import { api, buzz, compressImage, timeAgo } from "@/lib/client";
import { sfx } from "@/lib/sound";
import { REACTIONS } from "@/lib/categories";

type MiniU = { id: number; name: string; emoji: string; color: string; avatarV: number; nickname: string | null };
export type Post = {
  id: number; kind: string; text: string | null; hasImage: boolean; created_at: string; date: string | null;
  user: MiniU; reactions: Record<string, number[]>; comments: { id: number; text: string; created_at: string; user: MiniU }[];
};

const KIND_STYLE: Record<string, { bg: string; label?: string }> = {
  done: { bg: "linear-gradient(120deg, rgba(255,214,230,.9), rgba(255,255,255,.7))", label: "Journée validée" },
  wheel: { bg: "linear-gradient(120deg, rgba(227,218,255,.9), rgba(255,255,255,.7))", label: "Consequence wheel" },
  sos: { bg: "linear-gradient(120deg, rgba(255,90,130,.25), rgba(255,255,255,.75))", label: "SOS motivation" },
};

export function PostCard({ p, meId, isAdmin, onChange }: { p: Post; meId: number; isAdmin?: boolean; onChange: () => void }) {
  const toast = useToast();
  const [openC, setOpenC] = useState(false);
  const [text, setText] = useState("");
  const [local, setLocal] = useState(p.reactions);
  useEffect(() => setLocal(p.reactions), [p.reactions]);
  const auto = p.kind === "done" || p.kind === "wheel";
  const ks = KIND_STYLE[p.kind];

  async function react(e: string) {
    const mine = local[e]?.includes(meId);
    setLocal({ ...local, [e]: mine ? local[e].filter((x) => x !== meId) : [...(local[e] || []), meId] });
    sfx.pop(); buzz(8);
    try { await api(`/api/posts/${p.id}/react`, { body: { emoji: e } }); onChange(); } catch (err) { toast((err as Error).message); }
  }
  async function comment() {
    if (!text.trim()) return;
    try { await api(`/api/posts/${p.id}/comments`, { body: { text } }); setText(""); sfx.send(); onChange(); }
    catch (err) { toast((err as Error).message); }
  }

  return (
    <motion.article id={`post-${p.id}`} layout className="glass" style={{ padding: 16, background: ks?.bg, scrollMarginTop: 20 }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <header className="row" style={{ gap: 10 }}>
        <Link href={`/girls/${p.user.id}`}><Avatar u={p.user} size={40} /></Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 650 }}>{p.user.name} {auto && <span style={{ fontWeight: 500 }}>{p.text}</span>}</div>
          <div className="tiny soft">{ks?.label ? `${ks.label} · ` : ""}{timeAgo(p.created_at)}</div>
        </div>
        {(p.user.id === meId || isAdmin) && (
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Supprimer"
            onClick={async () => { if (confirm("Supprimer ce post ?")) { await api(`/api/posts/${p.id}`, { method: "DELETE" }); onChange(); } }}>
            <Trash2 size={15} />
          </button>
        )}
      </header>
      {p.kind === "sos" && <div className="row small" style={{ marginTop: 10, fontWeight: 700, color: "var(--cherry)" }}><Siren size={16} /> {p.user.name} a besoin de vous. Envoyez de la force !</div>}
      {!auto && p.text && <p style={{ margin: "12px 0 0", lineHeight: 1.5, fontSize: 15.5, whiteSpace: "pre-wrap" }}>{p.text}</p>}
      {p.hasImage && <img src={`/api/posts/${p.id}/image`} alt="" loading="lazy" style={{ marginTop: 12, borderRadius: 20, width: "100%" }} />}
      <div className="row wrap" style={{ marginTop: 12, gap: 6 }}>
        {REACTIONS.map((e) => {
          const n = local[e]?.length || 0;
          const mine = local[e]?.includes(meId);
          return (
            <motion.button key={e} whileTap={{ scale: 1.35 }} onClick={() => react(e)} className="pill"
              style={{ border: 0, background: mine ? "#fff" : "rgba(255,255,255,.5)", boxShadow: mine ? "0 0 0 1.5px var(--hot)" : undefined }}>
              <span style={{ fontSize: 15 }}>{e}</span>{n > 0 && <span>{n}</span>}
            </motion.button>
          );
        })}
        <button className="pill" style={{ border: 0, marginLeft: "auto" }} onClick={() => setOpenC(!openC)}>
          <MessageCircle size={14} /> {p.comments.length || ""}
        </button>
      </div>
      <AnimatePresence>
        {(openC || p.comments.length > 0) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div className="stack" style={{ gap: 8, marginTop: 12 }}>
              {p.comments.map((c) => (
                <div key={c.id} className="row" style={{ alignItems: "flex-start", gap: 8 }}>
                  <Avatar u={c.user} size={26} />
                  <div style={{ background: "rgba(255,255,255,.7)", borderRadius: "4px 16px 16px 16px", padding: "7px 11px", fontSize: 14 }}>
                    <b>{c.user.name}</b> {c.text}
                  </div>
                </div>
              ))}
              {openC && (
                <div className="row" style={{ gap: 6 }}>
                  <input className="input" style={{ padding: "10px 14px", fontSize: 15 }} placeholder="Un mot pour elle…" value={text}
                    onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && comment()} />
                  <button className="icon-btn" onClick={comment} aria-label="Envoyer" style={{ background: "var(--cherry-grad)", color: "#fff" }}><Send size={16} /></button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export function Composer({ onPosted }: { onPosted: () => void }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const prompts = ["Day 14 : survived leg day. Barely.", "Today's little win…", "Mood : productive princess 👑", "Ce que j'ai mangé de healthy aujourd'hui…"];
  const [ph] = useState(() => prompts[Math.floor(Math.random() * prompts.length)]);

  async function post(kind = "post") {
    if (!text.trim() && !image && kind !== "sos") return;
    setBusy(true);
    try {
      await api("/api/posts", { body: { text: kind === "sos" ? text || "J'ai besoin de motivation aujourd'hui 🥺" : text, image, kind } });
      setText(""); setImage(null);
      kind === "sos" ? sfx.sos() : sfx.send();
      buzz(15);
      toast(kind === "sos" ? "SOS envoyé, les girls arrivent 🆘💗" : "Posté dans le Tea ☕");
      onPosted();
    } catch (e) { toast((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="glass" style={{ padding: 14 }}>
      <textarea className="textarea" style={{ minHeight: 70, background: "rgba(255,255,255,.6)" }} placeholder={ph} value={text} onChange={(e) => setText(e.target.value)} />
      {image && (
        <div style={{ position: "relative", marginTop: 10 }}>
          <img src={image} alt="" style={{ borderRadius: 18, maxHeight: 260, width: "100%", objectFit: "cover" }} />
          <button className="icon-btn" style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32 }} onClick={() => setImage(null)} aria-label="Retirer"><X size={15} /></button>
        </div>
      )}
      <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await compressImage(f)); e.target.value = ""; }} />
      <div className="row" style={{ marginTop: 10, gap: 8 }}>
        <button className="icon-btn" onClick={() => file.current?.click()} aria-label="Ajouter une photo"><ImagePlus size={18} /></button>
        <button className="btn ghost sm" onClick={() => post("sos")} disabled={busy} style={{ color: "var(--cherry)" }}><Siren size={15} /> SOS</button>
        <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => post()} disabled={busy || (!text.trim() && !image)}>Poster <Send size={14} /></button>
      </div>
    </div>
  );
}

/** The Daily Tea ☕ — live-ish feed (refreshes every 15 s). */
export default function TeaFeed({ meId, isAdmin, userId, withComposer = true }: { meId: number; isAdmin?: boolean; userId?: number; withComposer?: boolean }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const load = useCallback(() => api<{ posts: Post[] }>(`/api/posts${userId ? `?user=${userId}` : ""}`).then((d) => setPosts(d.posts)), [userId]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  // arriving from an SOS banner: scroll to that post and make it pulse
  const [jumped, setJumped] = useState(false);
  useEffect(() => {
    if (!posts || jumped || typeof window === "undefined" || !window.location.hash.startsWith("#post-")) return;
    setJumped(true);
    const el = document.getElementById(window.location.hash.slice(1));
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.animate([{ boxShadow: "0 0 0 0 rgba(255,61,127,.6)" }, { boxShadow: "0 0 0 14px rgba(255,61,127,0)" }], { duration: 900, iterations: 3 });
      }, 250);
    }
  }, [posts, jumped]);
  return (
    <div className="stack" style={{ gap: 14 }}>
      {withComposer && <Composer onPosted={load} />}
      {posts?.length === 0 && (
        <div className="glass pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>☕</div>
          <p className="muted" style={{ fontWeight: 600, margin: "6px 0 0" }}>Le Tea est encore froid. Sois la première à le servir.</p>
        </div>
      )}
      {posts?.map((p) => <PostCard key={p.id} p={p} meId={meId} isAdmin={isAdmin} onChange={load} />)}
    </div>
  );
}
