import "server-only";
import { all, getStart } from "./db";
import { addDays, diffDays } from "./dates";
import { CHALLENGE_DAYS } from "./categories";
import { loadTracking, statsFor } from "./tracking";

/**
 * Every missed day (not perfect) since day 1 that hasn't been spun yet.
 * The app won't let her in until the wheel has decided for each of them.
 */
export async function pendingSpins(uid: number, today: string) {
  const start = await getStart();
  const t = await loadTracking(uid);
  const st = statsFor(t, uid, start, today);
  if (st.goalCount === 0) return [];
  const spun = new Set((await all<{ date: string }>("SELECT date FROM spins WHERE user_id = ?", [uid])).map((r) => r.date));
  const out: string[] = [];
  const last = Math.min(diffDays(start, addDays(today, -1)), CHALLENGE_DAYS - 1);
  for (let i = 0; i <= last; i++) {
    const d = addDays(start, i);
    if (!st.perfectDates.includes(d) && !spun.has(d)) out.push(d);
  }
  return out;
}

/** Punishments she got but hasn't proved yet. */
export async function owedPunishments(uid: number) {
  const rows = await all<{ id: number; text: string; date: string | null }>(
    "SELECT id, text, date FROM posts WHERE user_id = ? AND kind = 'wheel' AND status = 'pending' ORDER BY id", [uid]);
  return rows.map((r) => ({ postId: Number(r.id), text: r.text, date: r.date }));
}
