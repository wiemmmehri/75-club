"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useToast } from "./Toast";
import { pick } from "@/lib/client";
import { sfx } from "@/lib/sound";
import {
  CAT, CATEGORIES, CUSTOM_EMOJIS, MAX_GOALS, MAX_REACHED, SKIP_CONFIRM, SKIP_LINES, ZERO_GOALS, type CatKey,
} from "@/lib/categories";

export type GoalItem = { key: string; id?: number; category: string; title: string; emoji: string };

let seq = 0;
const k = () => `n${Date.now()}${seq++}`;

export const draftFrom = (goals: { id: number; category: string; title: string; emoji: string }[]): GoalItem[] =>
  goals.map((g) => ({ key: `g${g.id}`, id: g.id, category: g.category, title: g.title, emoji: g.emoji }));

/** Default for a brand-new member: the 4 classics, all optional. */
export const starterDraft = (): GoalItem[] => CATEGORIES.map((c) => ({ key: k(), category: c.key, title: "", emoji: c.emoji }));

export const toPayload = (list: GoalItem[]) =>
  list.filter((g) => g.title.trim()).map((g) => ({ id: g.id, category: g.category, title: g.title, emoji: g.emoji }));

/**
 * Goals manager: 1 to 6 goals. The 4 classics are optional (with a little roast if you skip them),
 * plus personal goals with their own emoji.
 */
export default function GoalsForm({ value, onChange }: { value: GoalItem[]; onChange: (v: GoalItem[]) => void }) {
  const toast = useToast();
  const [emojiFor, setEmojiFor] = useState<string | null>(null);
  const filled = value.filter((g) => g.title.trim());
  const usedCats = new Set(value.map((g) => g.category));
  const missing = CATEGORIES.filter((c) => !usedCats.has(c.key) || !value.find((g) => g.category === c.key)?.title.trim());
  const full = value.length >= MAX_GOALS;

  function add(category: string) {
    if (full) { toast(MAX_REACHED); sfx.uncheck(); return; }
    const emoji = category === "custom" ? CUSTOM_EMOJIS[value.length % CUSTOM_EMOJIS.length] : CAT[category as CatKey].emoji;
    onChange([...value, { key: k(), category, title: "", emoji }]);
    sfx.pop();
  }
  function remove(item: GoalItem) {
    onChange(value.filter((g) => g.key !== item.key));
    sfx.uncheck();
    toast(item.category in SKIP_LINES ? SKIP_LINES[item.category as CatKey] : pick(SKIP_CONFIRM));
  }
  const set = (key: string, patch: Partial<GoalItem>) => onChange(value.map((g) => (g.key === key ? { ...g, ...patch } : g)));

  return (
    <div className="stack">
      <AnimatePresence initial={false}>
        {value.map((g) => {
          const base = g.category in CAT ? CAT[g.category as CatKey] : null;
          return (
            <motion.div key={g.key} layout initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -60, height: 0, marginTop: 0 }}
              className="glass" style={{ padding: 14, background: `linear-gradient(120deg, ${base?.soft || "#eee6ff"}, rgba(255,255,255,.6))` }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <button type="button" onClick={() => !base && setEmojiFor(emojiFor === g.key ? null : g.key)}
                  className="label" style={{ margin: 0, color: "var(--ink)", border: 0, background: "none", padding: 0, cursor: base ? "default" : "pointer" }}>
                  <span style={{ fontSize: 18 }}>{g.emoji}</span> {base ? base.label : "Objectif perso"} {!base && <span className="tiny soft">(touche l&apos;emoji)</span>}
                </button>
                <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => remove(g)} aria-label="Retirer cet objectif"><X size={14} /></button>
              </div>
              {emojiFor === g.key && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, marginBottom: 8 }}>
                  {CUSTOM_EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => { set(g.key, { emoji: e }); setEmojiFor(null); sfx.tap(); }}
                      style={{ fontSize: 20, padding: "5px 0", border: 0, borderRadius: 12, background: e === g.emoji ? "#fff" : "transparent" }}>{e}</button>
                  ))}
                </div>
              )}
              <input className="input" value={g.title} maxLength={120} placeholder={base?.placeholder || "Ex : 8h de sommeil, pas de réseaux avant 10h…"}
                onChange={(e) => set(g.key, { title: e.target.value })} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* gentle roast for the classics she skipped */}
      {missing.length > 0 && filled.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          {missing.map((c) => <div key={c.key} className="small muted" style={{ fontWeight: 500 }}>{SKIP_LINES[c.key]}</div>)}
        </div>
      )}
      {filled.length === 0 && <div className="error">{ZERO_GOALS}</div>}

      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="label" style={{ margin: 0 }}>Ajouter un objectif</span>
          <span className="pill">{value.length}/{MAX_GOALS}</span>
        </div>
        {full ? <p className="small muted" style={{ margin: 0 }}>{MAX_REACHED}</p> : (
          <div className="row wrap" style={{ gap: 6 }}>
            {CATEGORIES.filter((c) => !usedCats.has(c.key)).map((c) => (
              <button key={c.key} type="button" className="pill" style={{ border: 0, padding: "8px 12px" }} onClick={() => add(c.key)}>
                <Plus size={13} /> {c.emoji} {c.label}
              </button>
            ))}
            <button type="button" className="pill" style={{ border: 0, padding: "8px 12px", background: "var(--ink)", color: "#fff" }} onClick={() => add("custom")}>
              <Plus size={13} /> ✨ Objectif perso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
