"use client";
import confetti from "canvas-confetti";

export async function api<T = any>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method || (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401 && !url.includes("/auth/")) window.location.href = "/login";
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Oups, quelque chose a coincé.");
  return data as T;
}

export function compressImage(file: File, max = 1100, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Impossible de lire cette image."));
    img.src = url;
  });
}

const PALETTE = ["#FF3D7F", "#FFD3E2", "#E3DAFF", "#FFF1C7", "#ffffff", "#D9134F"];

export function burst(big = false, origin = { x: 0.5, y: 0.4 }) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const base = { colors: PALETTE, zIndex: 120, disableForReducedMotion: true };
  if (!big) { confetti({ ...base, particleCount: 26, spread: 70, startVelocity: 26, scalar: 0.8, origin }); return; }
  let shapes: confetti.Shape[] | undefined;
  try { shapes = [confetti.shapeFromText({ text: "🎀", scalar: 2 }), confetti.shapeFromText({ text: "💗", scalar: 2 }), "circle"]; } catch {}
  confetti({ ...base, particleCount: 80, spread: 110, origin, shapes, scalar: 1.5, gravity: 0.8 });
  setTimeout(() => confetti({ ...base, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } }), 220);
  setTimeout(() => confetti({ ...base, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } }), 380);
}

export function buzz(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern); } catch {}
}

export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function avatarUrl(u: { id: number; avatarV: number }) {
  return u.avatarV ? `/api/avatar/${u.id}?v=${u.avatarV}` : null;
}

export function timeAgo(sqlUtc: string) {
  const t = new Date(sqlUtc.replace(" ", "T") + "Z").getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}
