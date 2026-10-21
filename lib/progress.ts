import "server-only";
import { all, getStart, one } from "./db";
import { badges, tier } from "./stats";
import { activeMissions, loadTracking, statsFor } from "./tracking";

export async function progressFor(uid: number, today: string) {
  const start = await getStart();
  const t = await loadTracking(uid);
  const days = await all<{ date: string; mood: string | null; note: string | null; water: number }>(
    "SELECT date, mood, note, water FROM days WHERE user_id = ? ORDER BY date DESC", [uid]);
  const n = async (sql: string) => Number((await one<{ n: number }>(sql, [uid]))?.n || 0);
  const photos = await n("SELECT COUNT(*) AS n FROM photos WHERE user_id = ?");
  const posts = await n("SELECT COUNT(*) AS n FROM posts WHERE user_id = ? AND kind IN ('post','sos')");
  const hype = (await n("SELECT COUNT(*) AS n FROM reactions WHERE user_id = ?")) + (await n("SELECT COUNT(*) AS n FROM comments WHERE user_id = ?"));
  const stats = statsFor(t, uid, start, today);
  return {
    start, stats, goals: activeMissions(t, uid), tier: tier(stats.perfectDays),
    days: days.map((d) => ({ ...d, water: Number(d.water) })),
    badges: badges(stats, { photos, posts, hype }),
  };
}
