import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { all, getStart, one, run } from "@/lib/db";
import { dayNumber, isValidDate } from "@/lib/dates";
import { autoPost } from "@/lib/feed";

export const dynamic = "force-dynamic";

async function load(uid: number, date: string) {
  const checks = await all<{ mission_id: number }>("SELECT mission_id FROM mission_checks WHERE user_id = ? AND date = ?", [uid, date]);
  const day = await one<{ mood: string | null; note: string | null; water: number }>("SELECT mood, note, water FROM days WHERE user_id = ? AND date = ?", [uid, date]);
  return { date, checks: checks.map((c) => Number(c.mission_id)), mood: day?.mood ?? null, note: day?.note ?? "", water: Number(day?.water ?? 0) };
}

export async function GET(req: Request) {
  return guard(async (s) => {
    const date = new URL(req.url).searchParams.get("date");
    if (!isValidDate(date)) return bad("Date invalide.");
    return NextResponse.json(await load(s.uid, date));
  });
}

export async function POST(req: Request) {
  return guard(async (s) => {
    const b = await req.json();
    if (!isValidDate(b.date)) return bad("Date invalide.");
    if (b.action === "toggle") {
      const m = await one("SELECT id FROM missions WHERE id = ? AND user_id = ?", [Number(b.mission), s.uid]);
      if (!m) return bad("Objectif inconnu.");
      if (b.done) await run("INSERT OR IGNORE INTO mission_checks (user_id, date, mission_id) VALUES (?, ?, ?)", [s.uid, b.date, Number(b.mission)]);
      else await run("DELETE FROM mission_checks WHERE user_id = ? AND date = ? AND mission_id = ?", [s.uid, b.date, Number(b.mission)]);
      // snapshot: how many goals she had that day (so adding a goal later doesn't rewrite the past)
      const active = await all<{ id: number }>("SELECT id FROM missions WHERE user_id = ? AND archived = 0", [s.uid]);
      await run(`INSERT INTO day_totals (user_id, date, total) VALUES (?, ?, ?)
                 ON CONFLICT(user_id, date) DO UPDATE SET total = excluded.total`, [s.uid, b.date, active.length]);
      const d = await load(s.uid, b.date);
      const ids = new Set(active.map((a) => Number(a.id)));
      if (active.length > 0 && d.checks.filter((c) => ids.has(c)).length >= active.length) {
        const n = dayNumber(await getStart(), b.date);
        await autoPost(s.uid, "done", `a validé son jour ${n} 👑 ${active.length}/${active.length}`, `done:${s.uid}:${b.date}`, b.date);
      }
      return NextResponse.json(d);
    }
    const cur = await load(s.uid, b.date);
    const mood = b.mood !== undefined ? (b.mood === null ? null : String(b.mood).slice(0, 10)) : cur.mood;
    const note = b.note !== undefined ? String(b.note).slice(0, 3000) : cur.note;
    const water = b.water !== undefined ? Math.max(0, Math.min(12, Number(b.water) || 0)) : cur.water;
    await run(`INSERT INTO days (user_id, date, mood, note, water) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(user_id, date) DO UPDATE SET mood = excluded.mood, note = excluded.note, water = excluded.water`,
      [s.uid, b.date, mood, note, water]);
    return NextResponse.json(await load(s.uid, b.date));
  });
}
