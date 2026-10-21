import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";
import { WHEEL } from "@/lib/categories";
import { autoPost } from "@/lib/feed";
import { owedPunishments, pendingSpins } from "@/lib/punish";

export const dynamic = "force-dynamic";

/** What the wheel gate needs: days still to spin + punishments still to prove. */
export async function GET(req: Request) {
  return guard(async (s) => {
    const today = new URL(req.url).searchParams.get("today");
    if (!isValidDate(today)) return bad("Date invalide.");
    if (s.role === "admin") return NextResponse.json({ pending: [], owed: [] });
    return NextResponse.json({ pending: await pendingSpins(s.uid, today), owed: await owedPunishments(s.uid) });
  });
}

/** The server picks the result so nobody can cheat 😌 */
export async function POST(req: Request) {
  return guard(async (s) => {
    const { date, today } = await req.json();
    if (!isValidDate(date) || !isValidDate(today)) return bad("Date invalide.");
    if (!(await pendingSpins(s.uid, today)).includes(date)) return bad("Pas de roue à tourner pour ce jour 🤍");
    const index = Math.floor(Math.random() * WHEEL.length);
    const w = WHEEL[index];
    const r = await run("INSERT OR IGNORE INTO spins (user_id, date, result) VALUES (?, ?, ?)", [s.uid, date, w.label]);
    if (!r.rowsAffected) return bad("Tu as déjà tourné la roue pour ce jour.");
    const tag = `wheel:${s.uid}:${date}`;
    await autoPost(s.uid, "wheel", `a tourné la roue 🎡 : ${w.emoji} ${w.label}`, tag, date);
    const free = w.proof === "none";
    await run(`UPDATE posts SET status = ?, done_at = ${free ? "datetime('now')" : "NULL"} WHERE tag = ?`, [free ? "free" : "pending", tag]);
    const p = await one<{ id: number }>("SELECT id FROM posts WHERE tag = ?", [tag]);
    return NextResponse.json({ index, postId: Number(p?.id) });
  });
}
