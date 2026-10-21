import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { all, getStart, one, run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const MEASURES = ["waist", "hips", "chest", "arm", "thigh"] as const;

/** Body journal: private, even for the admin. */
export async function GET() {
  return guard(async (s) => {
    const profile = await one<{ height: number | null; goal: number | null }>("SELECT height, goal FROM body_profile WHERE user_id = ?", [s.uid]);
    const logs = await all("SELECT date, weight, waist, hips, chest, arm, thigh, note FROM body_logs WHERE user_id = ? ORDER BY date", [s.uid]);
    const photos = await all<{ id: number; date: string; pose: string }>("SELECT id, date, pose FROM body_photos WHERE user_id = ? ORDER BY date, id", [s.uid]);
    return NextResponse.json({
      start: await getStart(),
      profile: { height: profile?.height ?? null, goal: profile?.goal ?? null },
      logs,
      photos: photos.map((p) => ({ ...p, id: Number(p.id) })),
    });
  });
}

const num = (v: unknown, min: number, max: number) => {
  if (v === null || v === "" || v === undefined) return null;
  const n = Math.round(Number(v) * 10) / 10;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export async function POST(req: Request) {
  return guard(async (s) => {
    const b = await req.json();
    if (b.action === "profile") {
      await run(`INSERT INTO body_profile (user_id, height, goal) VALUES (?, ?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET height = excluded.height, goal = excluded.goal`,
        [s.uid, num(b.height, 100, 230), num(b.goal, 30, 250)]);
      return NextResponse.json({ ok: true });
    }
    if (!isValidDate(b.date)) return bad("Date invalide.");
    const vals = [num(b.weight, 30, 250), ...MEASURES.map((k) => num(b[k], 10, 250))];
    const note = typeof b.note === "string" ? b.note.trim().slice(0, 500) || null : null;
    if (vals.every((v) => v === null) && !note) {
      await run("DELETE FROM body_logs WHERE user_id = ? AND date = ?", [s.uid, b.date]);
      return NextResponse.json({ ok: true });
    }
    await run(`INSERT INTO body_logs (user_id, date, weight, waist, hips, chest, arm, thigh, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id, date) DO UPDATE SET weight = excluded.weight, waist = excluded.waist, hips = excluded.hips,
               chest = excluded.chest, arm = excluded.arm, thigh = excluded.thigh, note = excluded.note`,
      [s.uid, b.date, ...vals, note]);
    return NextResponse.json({ ok: true });
  });
}
