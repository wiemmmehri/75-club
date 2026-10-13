import { CAT_KEYS, CHALLENGE_DAYS, type CatKey } from "./categories";
import { addDays, diffDays } from "./dates";

export type MissionLite = { id: number; category: string };
export type CheckRow = { date: string; mission_id: number };

export type Stats = {
  day: number;
  elapsed: number;
  totalChecks: number;
  pct: number;
  perfectDays: number;
  streak: number;
  bestStreak: number;
  perCat: Record<CatKey, number>;
  perGoal: Record<number, number>;
  byDate: Record<string, number[]>;
  perfectDates: string[];
  todayCount: number;
  goalCount: number;
  lastActive: string | null;
};

/**
 * A "perfect day" = every goal she had that day is checked.
 * Past days use the number of goals she had at the time (snapshot), today uses her current goals.
 */
export function computeStats(start: string, today: string, rows: CheckRow[], missions: MissionLite[], totals: Record<string, number>, current: number): Stats {
  const cat = new Map(missions.map((m) => [Number(m.id), m.category]));
  const byDate: Record<string, number[]> = {};
  const perCat = Object.fromEntries(CAT_KEYS.map((k) => [k, 0])) as Record<CatKey, number>;
  const perGoal: Record<number, number> = {};
  let lastActive: string | null = null;
  for (const r of rows) {
    const id = Number(r.mission_id);
    (byDate[r.date] ||= []).push(id);
    if (r.date >= start && r.date <= today) {
      const c = cat.get(id) as CatKey | undefined;
      if (c && perCat[c] !== undefined) perCat[c]++;
      perGoal[id] = (perGoal[id] || 0) + 1;
    }
    if (!lastActive || r.date > lastActive) lastActive = r.date;
  }
  const need = (d: string) => (d === today ? current : totals[d] ?? current);
  const isPerfect = (d: string) => need(d) > 0 && (byDate[d]?.length || 0) >= need(d);
  const day = diffDays(start, today) + 1;
  const elapsed = Math.max(0, Math.min(CHALLENGE_DAYS, day));
  let totalChecks = 0, possible = 0, perfectDays = 0, best = 0, run = 0;
  const perfectDates: string[] = [];
  for (let i = 0; i < elapsed; i++) {
    const d = addDays(start, i);
    totalChecks += Math.min(byDate[d]?.length || 0, need(d));
    possible += need(d);
    if (isPerfect(d)) { perfectDays++; perfectDates.push(d); run++; best = Math.max(best, run); }
    else if (d !== today) run = 0;
  }
  let streak = 0;
  let cursor = isPerfect(today) ? today : addDays(today, -1);
  while (diffDays(start, cursor) >= 0 && isPerfect(cursor)) { streak++; cursor = addDays(cursor, -1); }
  return {
    day, elapsed, totalChecks, pct: possible ? Math.round((totalChecks / possible) * 100) : 0, perfectDays, streak, bestStreak: best,
    perCat, perGoal, byDate, perfectDates, todayCount: byDate[today]?.length || 0, goalCount: current, lastActive,
  };
}

export type Badge = { key: string; emoji: string; title: string; desc: string; unlocked: boolean };

export function badges(st: Stats, extra: { photos: number; posts: number; hype: number }): Badge[] {
  return [
    { key: "first", emoji: "🌱", title: "First step", desc: "Cocher ton premier objectif", unlocked: st.totalChecks >= 1 },
    { key: "perfect", emoji: "💗", title: "Perfect day", desc: "Tous tes objectifs en un jour", unlocked: st.perfectDays >= 1 },
    { key: "s3", emoji: "🔥", title: "On fire", desc: "3 jours parfaits d'affilée", unlocked: st.bestStreak >= 3 },
    { key: "s7", emoji: "💅", title: "Semaine de reine", desc: "7 jours parfaits d'affilée", unlocked: st.bestStreak >= 7 },
    { key: "s21", emoji: "🦋", title: "Habit unlocked", desc: "21 jours parfaits d'affilée", unlocked: st.bestStreak >= 21 },
    { key: "tea", emoji: "☕", title: "Tea spiller", desc: "Poster 5 updates dans le Tea", unlocked: extra.posts >= 5 },
    { key: "hype", emoji: "📣", title: "Hype girl", desc: "Envoyer 20 réactions ou commentaires", unlocked: extra.hype >= 20 },
    { key: "photo", emoji: "📸", title: "Glow-up museum", desc: "Ajouter 3 photos d'évolution", unlocked: extra.photos >= 3 },
    { key: "half", emoji: "🌗", title: "Mi-parcours", desc: "Atteindre le jour 38", unlocked: st.day >= 38 },
    { key: "p30", emoji: "💎", title: "Diamond", desc: "30 jours parfaits", unlocked: st.perfectDays >= 30 },
    { key: "p50", emoji: "🪩", title: "Disco queen", desc: "50 jours parfaits", unlocked: st.perfectDays >= 50 },
    { key: "end", emoji: "👑", title: "The girl she became", desc: "Terminer les 75 jours", unlocked: st.day > 75 },
  ];
}

export function tier(perfectDays: number) {
  if (perfectDays >= 45) return { key: "holo", label: "Holo Icon" };
  if (perfectDays >= 21) return { key: "gold", label: "Gold" };
  if (perfectDays >= 7) return { key: "silver", label: "Silver" };
  return { key: "pearl", label: "Pearl" };
}
