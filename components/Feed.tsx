"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Send, Trash2, X, MessageCircle, Siren, Mic, Gavel } from "lucide-react";
import Avatar from "./Avatar";
import Sheet from "./Sheet";
import { useToast } from "./Toast";
import { VoicePlayer, VoiceRecorder } from "./Voice";
import { api, burst, buzz, compressImage, timeAgo } from "@/lib/client";
import { sfx } from "@/lib/sound";
import { REACTIONS, punishmentOf } from "@/lib/categories";

type MiniU = { id: number; name: string; emoji: string; color: string; avatarV: number; nickname: string | null };
export type Post = {
  id: number; kind: string; text: string | null; hasImage: boolean; created_at: string; date: string | null;
  status: string | null; proofText: string | null; doneAt: string | null;
  media: { id: number; kind: "image" | "audio" }[]; checkPhotos: number[];
  user: MiniU; reactions: Record<string, number[]>; comments: { id: number; text: string; hasAudio: boolean; created_at: string; user: MiniU }[];
};

const STAMPS: Record<string, { label: string; color: string }> = {
  pending: { label: "EN ATTENTE ⏳", color: "#d9134f" },
  done: { label: "PROUVÉ ✅", color: "#15946c" },
  free: { label: "FREE PASS ✨", color: "#c08410" },
};

/** Photos in a little mosaic, tap to zoom. */
function Mosaic({ srcs }: { srcs: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!srcs.length) return null;
  const cols = srcs.length === 1 ? 1 : srcs.length === 2 || srcs.length === 4 ? 2 : 3;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6, marginTop: 12 }}>
        {srcs.map((src, i) => (
          <motion.button key={src} type="button" onClick={() => setOpen(src)} whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, scale: 0.9, rotate: i % 2 ? 2 : -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: i * 0.05 }}
            style={{ border: 0, padding: 0, borderRadius: 16, overflow: "hidden", aspectRatio: cols === 1 ? "4/3" : "1", background: "#fff" }}>
            <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)}>{open && <img src={open} alt="" style={{ borderRadius: 24, width: "100%" }} />}</Sheet>
    </>
  );
}

/** The punishment part of a wheel post: what, status stamp, proofs, and the proof form for her. */
function Punishment({ p, meId, onChange }: { p: Post; meId: number; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const pun = punishmentOf(p.text || "");
  const st = STAMPS[p.status || ""];
  const mine = p.user.id === meId;
  const imgs = p.media.filter((m) => m.kind === "image");
  const auds = p.media.filter((m) => m.kind === "audio");
  if (!pun) return null;
  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 22, background: "rgba(255,255,255,.6)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.9)" }}>
      <div className="row" style={{ gap: 12 }}>
        <motion.span animate={p.status === "pending" ? { rotate: [0, -8, 8, 0] } : {}} transition={{ repeat: Infinity, duration: 1.4, repeatDelay: 2 }}
          style={{ width: 50, height: 50, borderRadius: 17, display: "grid", placeItems: "center", fontSize: 26, background: pun.color, flex: "none" }}>{pun.emoji}</motion.span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 22, lineHeight: 1.05 }}>{pun.label}</div>
          <div className="tiny soft">{p.status === "done" && p.doneAt ? `Prouvé ${timeAgo(p.doneAt)}` : p.status === "pending" ? `En attente ${timeAgo(p.created_at).replace("il y a", "depuis")}` : "La chance a parlé"}</div>
        </div>
        {st && <span className="stamp" style={{ color: st.color }}>{st.label}</span>}
      </div>
      {p.proofText && <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>« {p.proofText} »</p>}
      {auds.map((a) => <div key={a.id} style={{ marginTop: 10 }}><VoicePlayer src={`/api/media/${a.id}`} seed={a.id} /></div>)}
      <Mosaic srcs={imgs.map((m) => `/api/media/${m.id}`)} />
      {p.status === "pending" && mine && (
        <button className="btn block" style={{ marginTop: 12 }} onClick={() => setOpen(true)}>
          {pun.proof === "voice" ? "Envoyer mon vocal 🎙️" : "Poster ma preuve 📸"}
        </button>
      )}
      {p.status === "pending" && !mine && (
        <div className="tiny" style={{ marginTop: 10, fontWeight: 650, color: "var(--cherry)" }}>👀 {p.user.name} doit encore prouver. Relancez-la en commentaire.</div>
      )}
      <Sheet open={open} onClose={() => setOpen(false)}>
        {open && <ProofForm p={p} kind={pun.proof} hint={pun.hint} onDone={() => { setOpen(false); onChange(); }} />}
      </Sheet>
    </div>
  );
}

function ProofForm({ p, kind, hint, onDone }: { p: Post; kind: string; hint: string; onDone: () => void }) {
  const toast = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [audio, setAudio] = useState<{ url: string; secs: number } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const voice = kind === "voice";
  const ready = voice ? !!audio || text.trim().length > 0 : photos.length > 0 || text.trim().length > 0 || !!audio;

  async function submit() {
    if (!ready || busy) return;
    if (voice && audio && audio.secs < 20 && !confirm(`Ton vocal fait ${audio.secs}s au lieu de 20s… Le club va le remarquer 👀 Envoyer quand même ?`)) return;
    try {
      const all = [...photos.map((d) => ({ kind: "image", data: d })), ...(audio ? [{ kind: "audio", data: audio.url }] : [])];
      for (let i = 0; i < all.length; i++) {
        setBusy(`Envoi ${i + 1}/${all.length}…`);
        await api(`/api/posts/${p.id}/proof`, { body: { action: "add", ...all[i] } });
      }
      setBusy("Tampon officiel…");
      await api(`/api/posts/${p.id}/proof`, { body: { action: "finish", text } });
      sfx.complete(); burst(true); buzz([30, 60, 30, 60, 80]);
      toast("Punition prouvée ✅ Ton casier est propre");
      onDone();
    } catch (e) { toast((e as Error).message); setBusy(""); }
  }

  return (
    <div className="stack">
      <h2 className="h2" style={{ textAlign: "center", margin: 0 }}>Ta <em>preuve</em></h2>
      <p className="small muted" style={{ textAlign: "center", margin: 0 }}>{hint}</p>
      {voice ? (
        <div className="glass pad"><VoiceRecorder target={20} max={60} onChange={(url, secs) => setAudio(url ? { url, secs } : null)} /></div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {photos.map((ph, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 18, overflow: "hidden" }}>
                <img src={ph} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button className="icon-btn" style={{ position: "absolute", top: 4, right: 4, width: 26, height: 26 }} onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label="Retirer"><X size={13} /></button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => file.current?.click()} style={{ aspectRatio: "1", borderRadius: 18, border: "2px dashed rgba(217,19,79,.35)", background: "rgba(255,255,255,.6)", color: "var(--cherry)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12 }}>
                <span><ImagePlus size={22} style={{ display: "block", margin: "0 auto 4px" }} />Photo</span>
              </button>
            )}
          </div>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={async (e) => {
            const fs = Array.from(e.target.files || []).slice(0, 5 - photos.length);
            e.target.value = "";
            const out: string[] = [];
            for (const f of fs) out.push(await compressImage(f));
            setPhotos((p) => [...p, ...out]);
          }} />
          <details>
            <summary className="small" style={{ fontWeight: 650, cursor: "pointer", color: "var(--ink-2)" }}>🎙️ Ajouter un vocal (optionnel)</summary>
            <div style={{ marginTop: 10 }}><VoiceRecorder max={60} onChange={(url, secs) => setAudio(url ? { url, secs } : null)} /></div>
          </details>
        </>
      )}
      <textarea className="textarea" style={{ minHeight: 70 }} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={voice ? "Pas de micro ? Écris ton auto-clash ici (au moins 3 phrases, on surveille) ✍️" : "Un petit mot pour le tribunal…"} />
      <button className="btn block" disabled={!ready || !!busy} onClick={submit}><Gavel size={16} /> {busy || "Soumettre au tribunal"}</button>
    </div>
  );
}

const KIND_STYLE: Record<string, { bg: string; label?: string }> = {
  done: { bg: "linear-gradient(120deg, rgba(255,214,230,.9), rgba(255,255,255,.7))", label: "Journée validée" },
  wheel: { bg: "linear-gradient(120deg, rgba(227,218,255,.9), rgba(255,255,255,.7))", label: "Consequence wheel" },
  sos: { bg: "linear-gradient(120deg, rgba(255,90,130,.25), rgba(255,255,255,.75))", label: "SOS motivation" },
};

export function PostCard({ p, meId, isAdmin, onChange }: { p: Post; meId: number; isAdmin?: boolean; onChange: () => void }) {
  const toast = useToast();
  const [openC, setOpenC] = useState(false);
  const [text, setText] = useState("");
  const [rec, setRec] = useState(false);
  const [audio, setAudio] = useState<string | null>(null);
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
    if (!text.trim() && !audio) return;
    try {
      await api(`/api/posts/${p.id}/comments`, { body: { text, audio } });
      setText(""); setAudio(null); setRec(false); sfx.send(); onChange();
    } catch (err) { toast((err as Error).message); }
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
      {p.kind === "wheel" && <Punishment p={p} meId={meId} onChange={onChange} />}
      {p.kind === "done" && p.checkPhotos.length > 0 && <Mosaic srcs={p.checkPhotos.slice(0, 9).map((id) => `/api/check-photos/${id}`)} />}
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
                  <div style={{ background: "rgba(255,255,255,.7)", borderRadius: "4px 16px 16px 16px", padding: "7px 11px", fontSize: 14, minWidth: 0, flex: c.hasAudio ? 1 : undefined }}>
                    <b>{c.user.name}</b> {c.text}
                    {c.hasAudio && <div style={{ marginTop: 6 }}><VoicePlayer src={`/api/comments/${c.id}/audio`} seed={c.id} /></div>}
                  </div>
                </div>
              ))}
              {openC && (
                <div className="row" style={{ gap: 6 }}>
                  {rec ? (
                    <div style={{ flex: 1, minWidth: 0 }}><VoiceRecorder compact max={60} onChange={(url) => setAudio(url)} /></div>
                  ) : (
                    <input className="input" style={{ padding: "10px 14px", fontSize: 15 }} placeholder="Un mot pour elle…" value={text}
                      onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && comment()} />
                  )}
                  <button className="icon-btn" onClick={() => { setRec(!rec); setAudio(null); }} aria-label={rec ? "Écrire" : "Vocal"} style={{ flex: "none" }}>
                    {rec ? <X size={16} /> : <Mic size={16} />}
                  </button>
                  <button className="icon-btn" onClick={comment} aria-label="Envoyer" disabled={rec && !audio} style={{ background: "var(--cherry-grad)", color: "#fff", flex: "none", opacity: rec && !audio ? 0.5 : 1 }}><Send size={16} /></button>
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
  const [filter, setFilter] = useState<"all" | "wheel" | "pending">("all");
  const owed = posts?.filter((p) => p.kind === "wheel" && p.status === "pending") || [];
  const shown = posts?.filter((p) => filter === "all" || (filter === "wheel" ? p.kind === "wheel" : p.kind === "wheel" && p.status === "pending"));
  return (
    <div className="stack" style={{ gap: 14 }}>
      {withComposer && <Composer onPosted={load} />}
      {!userId && owed.length > 0 && (
        <motion.button className="dark row" onClick={() => setFilter("pending")} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ padding: 14, gap: 12, border: 0, width: "100%", textAlign: "left" }}>
          <span style={{ fontSize: 28 }}>⚖️</span>
          <span style={{ flex: 1 }}>
            <b>Le tribunal du club</b><br />
            <span className="small" style={{ opacity: 0.8 }}>{owed.length} punition{owed.length > 1 ? "s" : ""} en attente de preuve</span>
          </span>
          <span className="row" style={{ gap: 0 }}>
            {Array.from(new Map(owed.map((p) => [p.user.id, p.user])).values()).slice(0, 4).map((u, i) => (
              <span key={u.id} style={{ marginLeft: i ? -10 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px #2a0b1c" }}><Avatar u={u} size={30} /></span>
            ))}
          </span>
        </motion.button>
      )}
      {!userId && posts && posts.some((p) => p.kind === "wheel") && (
        <div className="seg" style={{ alignSelf: "flex-start" }}>
          {([["all", "Tout"], ["wheel", "Punitions 🎡"], ["pending", "En attente ⏳"]] as const).map(([k, l]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      )}
      {posts?.length === 0 && (
        <div className="glass pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>☕</div>
          <p className="muted" style={{ fontWeight: 600, margin: "6px 0 0" }}>Le Tea est encore froid. Sois la première à le servir.</p>
        </div>
      )}
      {shown?.map((p) => <PostCard key={p.id} p={p} meId={meId} isAdmin={isAdmin} onChange={load} />)}
      {filter !== "all" && shown?.length === 0 && <p className="muted small" style={{ textAlign: "center" }}>Casier judiciaire vierge pour tout le monde 😇</p>}
    </div>
  );
}
