import "server-only";
import { all } from "./db";
import { computeStats, type CheckRow } from "./stats";

export type Mission = { id: number; user_id: number; category: string; title: string; emoji: string; color: string; position: number; archived: number };
export type PublicMission = { id: number; category: string; title: string; emoji: string; color: string };

export const pubMission = (m: Mission): PublicMission => ({ id: Number(m.id), category: m.category, title: m.title, emoji: m.emoji, color: m.color });

/** Loads every mission, check and daily snapshot once (it's 5 people, keep it simple). */
export async function loadTracking(uid?: number) {
  const w = uid ? " WHERE user_id = ?" : "";
  const a = uid ? [uid] : [];
  const missions = await all<Mission>(`SELECT * FROM missions${w} ORDER BY position, id`, a);
  const checks = await all<CheckRow & { user_id: number }>(`SELECT user_id, date, mission_id FROM mission_checks${w}`, a);
  const totals = await all<{ user_id: number; date: string; total: number }>(`SELECT user_id, date, total FROM day_totals${w}`, a);
  return { missions, checks, totals };
}

export function activeMissions(t: Awaited<ReturnType<typeof loadTracking>>, uid: number) {
  return t.missions.filter((m) => Number(m.user_id) === uid && !Number(m.archived)).map(pubMission);
}

export function statsFor(t: Awaited<ReturnType<typeof loadTracking>>, uid: number, start: string, today: string) {
  const mine = t.missions.filter((m) => Number(m.user_id) === uid);
  const totals = Object.fromEntries(t.totals.filter((x) => Number(x.user_id) === uid).map((x) => [x.date, Number(x.total)]));
  return computeStats(
    start, today,
    t.checks.filter((c) => Number(c.user_id) === uid),
    mine.map((m) => ({ id: Number(m.id), category: m.category })),
    totals,
    mine.filter((m) => !Number(m.archived)).length,
  );
}
