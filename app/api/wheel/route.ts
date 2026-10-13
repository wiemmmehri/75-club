import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";
import { WHEEL } from "@/lib/categories";
import { autoPost } from "@/lib/feed";

export const dynamic = "force-dynamic";

/** The server picks the result so nobody can cheat 😌 */
export async function POST(req: Request) {
  return guard(async (s) => {
    const { date } = await req.json();
    if (!isValidDate(date)) return bad("Date invalide.");
    const index = Math.floor(Math.random() * WHEEL.length);
    const r = await run("INSERT OR IGNORE INTO spins (user_id, date, result) VALUES (?, ?, ?)", [s.uid, date, WHEEL[index].label]);
    if (!r.rowsAffected) return bad("Tu as déjà tourné la roue pour ce jour.");
    const w = WHEEL[index];
    await autoPost(s.uid, "wheel", `a tourné la roue 🎡 : ${w.emoji} ${w.label}`, `wheel:${s.uid}:${date}`, date);
    return NextResponse.json({ index });
  });
}
