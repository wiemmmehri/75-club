"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { buzz } from "@/lib/client";
import { sfx } from "@/lib/sound";

const MIMES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Impossible de lire le vocal."));
    r.readAsDataURL(b);
  });
}

/** Little pseudo-random waveform so each voice note has its own "face". */
function bars(seed: number, n = 28) {
  let x = seed * 9301 + 49297;
  return Array.from({ length: n }, (_, i) => {
    x = (x * 9301 + 49297) % 233280;
    const env = Math.sin((i / (n - 1)) * Math.PI) * 0.6 + 0.4;
    return 0.25 + (x / 233280) * 0.75 * env;
  });
}

/**
 * Record a voice note. `target` seconds draws a ring that fills up (e.g. 20 s for the insult punishment),
 * `max` stops automatically. Calls onChange with a data URL (or null when cleared).
 */
export function VoiceRecorder({ target, max = 60, onChange, compact = false }: {
  target?: number; max?: number; onChange: (dataUrl: string | null, seconds: number) => void; compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "rec" | "done">("idle");
  const [secs, setSecs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(20).fill(0.1));
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const t0 = useRef(0);
  const actx = useRef<AudioContext | null>(null);

  const cleanup = () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    actx.current?.close().catch(() => {});
    actx.current = null;
  };
  useEffect(() => () => cleanup(), []);

  async function start() {
    setErr("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErr("Ton navigateur ne sait pas enregistrer de vocal 😢 Écris un message à la place.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mime = MIMES.find((m) => MediaRecorder.isTypeSupported?.(m));
      const r = new MediaRecorder(s, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = async () => {
        const type = (r.mimeType || mime || "audio/webm").split(";")[0];
        const blob = new Blob(chunks, { type });
        const s = Math.round((Date.now() - t0.current) / 1000);
        cleanup();
        setPreview(URL.createObjectURL(blob));
        setState("done");
        onChange(await blobToDataUrl(blob), s);
      };
      rec.current = r;
      // live level meter
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const c = new AC();
        actx.current = c;
        const an = c.createAnalyser();
        an.fftSize = 64;
        c.createMediaStreamSource(s).connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        const loop = () => {
          an.getByteFrequencyData(buf);
          setLevels(Array.from({ length: 20 }, (_, i) => Math.max(0.08, (buf[i + 2] || 0) / 255)));
          setSecs((Date.now() - t0.current) / 1000);
          if ((Date.now() - t0.current) / 1000 >= max) stop();
          raf.current = requestAnimationFrame(loop);
        };
        raf.current = requestAnimationFrame(loop);
      }
      t0.current = Date.now();
      r.start();
      setState("rec");
      sfx.pop(); buzz(20);
    } catch {
      setErr("Micro refusé. Autorise le micro dans les réglages du navigateur 🎙️");
    }
  }

  function stop() {
    if (rec.current?.state === "recording") { rec.current.stop(); buzz(12); }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setSecs(0); setState("idle"); onChange(null, 0);
  }

  const goal = target || max;
  const pct = Math.min(1, secs / goal);
  const R = compact ? 20 : 34, C = 2 * Math.PI * R;
  const reached = target ? secs >= target : true;

  if (state === "done" && preview) {
    return (
      <div className="row" style={{ gap: 8 }}>
        <VoicePlayer src={preview} seed={Math.round(secs * 7) + 3} />
        <button type="button" className="icon-btn" style={{ width: 36, height: 36, flex: "none" }} onClick={reset} aria-label="Recommencer"><RotateCcw size={15} /></button>
      </div>
    );
  }

  return (
    <div className={compact ? "row" : "stack"} style={{ alignItems: "center", gap: compact ? 8 : 10 }}>
      <div className="row" style={{ gap: 14, justifyContent: "center" }}>
        <button type="button" onClick={state === "rec" ? stop : start} aria-label={state === "rec" ? "Arrêter" : "Enregistrer"}
          style={{ position: "relative", width: R * 2 + 12, height: R * 2 + 12, border: 0, background: "none", padding: 0, flex: "none" }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${R * 2 + 12} ${R * 2 + 12}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx={R + 6} cy={R + 6} r={R} fill="none" stroke="rgba(42,11,28,.08)" strokeWidth="4" />
            <circle cx={R + 6} cy={R + 6} r={R} fill="none" stroke={reached && state === "rec" ? "#20B486" : "var(--hot)"} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke .3s" }} />
          </svg>
          <motion.span animate={state === "rec" ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ repeat: Infinity, duration: 1.1 }}
            style={{ position: "absolute", inset: 10, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff",
              background: state === "rec" ? "linear-gradient(135deg,#ff5c5c,#d9134f)" : "var(--cherry-grad)", boxShadow: "0 10px 22px -10px rgba(217,19,79,.8)" }}>
            {state === "rec" ? <Square size={compact ? 13 : 18} fill="#fff" /> : <Mic size={compact ? 15 : 22} />}
          </motion.span>
        </button>
        {state === "rec" && (
          <div className="row" style={{ gap: 3, height: compact ? 30 : 44 }}>
            {levels.map((l, i) => <span key={i} style={{ width: 3, height: `${l * 100}%`, borderRadius: 3, background: "var(--hot)", transition: "height .08s" }} />)}
          </div>
        )}
      </div>
      {!compact && (
        <div className="small" style={{ fontWeight: 650, textAlign: "center" }}>
          {state === "rec"
            ? <span className="num" style={{ fontSize: 18 }}>{secs.toFixed(0)}s{target ? ` / ${target}s` : ""} {target && reached ? "✅ tu peux arrêter" : ""}</span>
            : target ? `Appuie et parle ${target} secondes 🎙️` : "Appuie pour enregistrer"}
        </div>
      )}
      {compact && state === "rec" && <span className="num small">{secs.toFixed(0)}s</span>}
      {err && <div className="error small">{err}</div>}
    </div>
  );
}

/**
 * Plays a voice note. Fetches it as a blob first: iPhone Safari is picky with streamed audio,
 * blob URLs work everywhere.
 */
export function VoicePlayer({ src, seed = 1, dark = false }: { src: string; seed?: number; dark?: boolean }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(0);
  const [dur, setDur] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const shape = useRef(bars(seed));

  useEffect(() => () => { audio.current?.pause(); }, []);

  async function toggle() {
    if (!audio.current) {
      setLoading(true);
      try {
        let url = src;
        if (!src.startsWith("blob:")) url = URL.createObjectURL(await (await fetch(src)).blob());
        const a = new Audio(url);
        a.ontimeupdate = () => setP(a.duration && Number.isFinite(a.duration) ? a.currentTime / a.duration : 0);
        a.onloadedmetadata = () => Number.isFinite(a.duration) && setDur(a.duration);
        a.onended = () => { setPlaying(false); setP(0); };
        a.onerror = () => { setErr(true); setPlaying(false); };
        audio.current = a;
      } catch { setErr(true); setLoading(false); return; }
      setLoading(false);
    }
    const a = audio.current!;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => setErr(true)); }
  }

  const fg = dark ? "#fff" : "var(--hot)";
  return (
    <div className="row" style={{ gap: 10, padding: "8px 12px 8px 8px", borderRadius: 999, flex: 1, minWidth: 0,
      background: dark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.8)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.9)" }}>
      <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Écouter"} disabled={loading}
        style={{ width: 34, height: 34, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", flex: "none", background: "var(--cherry-grad)", color: "#fff" }}>
        {playing ? <Pause size={15} fill="#fff" /> : <Play size={15} fill="#fff" style={{ marginLeft: 2 }} />}
      </button>
      <div className="row" style={{ gap: 2, height: 26, flex: 1, minWidth: 0 }}>
        {shape.current.map((h, i) => (
          <span key={i} style={{ flex: 1, maxWidth: 4, height: `${h * 100}%`, borderRadius: 3,
            background: i / shape.current.length <= p ? fg : dark ? "rgba(255,255,255,.3)" : "rgba(42,11,28,.16)", transition: "background .15s" }} />
        ))}
      </div>
      <span className="tiny num" style={{ flex: "none", opacity: 0.7 }}>{err ? "⚠️" : dur ? `${Math.round(dur)}s` : "🎙️"}</span>
    </div>
  );
}
