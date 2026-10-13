import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { all, run } from "@/lib/db";
import { CAT, CAT_KEYS, CUSTOM_COLORS, MAX_GOALS, MAX_REACHED, ZERO_GOALS, type CatKey } from "@/lib/categories";

export const dynamic = "force-dynamic";

type In = { id?: number; category: string; title: string; emoji?: string };

/**
 * Saves her whole list of goals (1 to 6). Goals she removed are archived, not deleted,
 * so her past days keep their history.
 */
export async function PUT(req: Request) {
  return guard(async (s) => {
    const { goals } = (await req.json()) as { goals: In[] };
    if (!Array.isArray(goals)) return bad("Objectifs invalides.");
    const list = goals
      .map((g) => ({ ...g, title: String(g.title || "").trim().slice(0, 120) }))
      .filter((g) => g.title);
    if (list.length === 0) return bad(ZERO_GOALS);
    if (list.length > MAX_GOALS) return bad(MAX_REACHED);
    const bases = list.filter((g) => g.category !== "custom").map((g) => g.category);
    if (new Set(bases).size !== bases.length) return bad("Chaque catégorie ne peut être choisie qu'une fois.");

    const existing = await all<{ id: number }>("SELECT id FROM missions WHERE user_id = ? AND archived = 0", [s.uid]);
    const keep = new Set<number>();
    let customIdx = 0;
    for (const [pos, g] of list.entries()) {
      const isBase = CAT_KEYS.includes(g.category as CatKey);
      const category = isBase ? g.category : "custom";
      const emoji = isBase ? CAT[g.category as CatKey].emoji : String(g.emoji || "✨").slice(0, 8);
      const color = isBase ? CAT[g.category as CatKey].color : CUSTOM_COLORS[customIdx++ % CUSTOM_COLORS.length];
      const id = Number(g.id);
      if (id && existing.some((e) => Number(e.id) === id)) {
        await run("UPDATE missions SET title = ?, emoji = ?, color = ?, position = ?, category = ? WHERE id = ? AND user_id = ?",
          [g.title, emoji, color, pos, category, id, s.uid]);
        keep.add(id);
      } else {
        await run("INSERT INTO missions (user_id, category, title, emoji, color, position) VALUES (?, ?, ?, ?, ?, ?)",
          [s.uid, category, g.title, emoji, color, pos]);
      }
    }
    for (const e of existing) if (!keep.has(Number(e.id))) await run("UPDATE missions SET archived = 1 WHERE id = ?", [Number(e.id)]);
    return NextResponse.json({ ok: true });
  });
}
