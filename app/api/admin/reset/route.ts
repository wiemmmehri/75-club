import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Restart the challenge on a new day 1. With `wipe`, the test data dated before that day goes away
 * (checks, moods, water, wheel spins, goal photos, automatic posts). Accounts, goals, normal posts,
 * glow-up photos and body journals are kept.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const { start_date, wipe } = await req.json();
    if (!isValidDate(start_date)) return bad("Date invalide.");
    if (wipe) {
      const auto = "SELECT id FROM posts WHERE kind IN ('done','wheel') AND date < ?";
      for (const t of ["reactions", "comments", "post_media"]) await run(`DELETE FROM ${t} WHERE post_id IN (${auto})`, [start_date]);
      await run("DELETE FROM posts WHERE kind IN ('done','wheel') AND date < ?", [start_date]);
      for (const t of ["mission_checks", "day_totals", "days", "spins", "check_photos"]) await run(`DELETE FROM ${t} WHERE date < ?`, [start_date]);
    }
    await run("INSERT INTO settings (key, value) VALUES ('start_date', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [start_date]);
    return NextResponse.json({ ok: true });
  }, { admin: true });
}
