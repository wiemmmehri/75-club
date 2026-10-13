import "server-only";
import { all, getStart, type UserRow } from "./db";
import { addDays, diffDays } from "./dates";
import { usersMap } from "./feed";
import { loadTracking, statsFor } from "./tracking";

export type Title = { key: string; emoji: string; title: string; desc: string; winners: number[]; score: number };

type Row = { user_id: number; date: string; category?: string; created_at?: string };

/** Weekly titles: different kinds of progress get rewarded, not just "who did the most". */
export async function weeklyTitles(today: string) {
  const start = await getStart();
  const users = (await all<UserRow>("SELECT * FROM users WHERE role = 'user'")).map((u) => Number(u.id));
  const checks = await all<Row>("SELECT c.user_id, c.date, m.category FROM mission_checks c JOIN missions m ON m.id = c.mission_id");
  const tr = await loadTracking();
  const perfectBy = new Map(users.map((u) => [u, statsFor(tr, u, start, today).perfectDates]));
  const posts = await all<Row>("SELECT user_id, substr(created_at,1,10) AS date, kind FROM posts WHERE kind IN ('post','sos')");
  const hype = await all<Row>(
    `SELECT user_id, substr(created_at,1,10) AS date FROM reactions
     UNION ALL SELECT user_id, substr(created_at,1,10) AS date FROM comments`
  );
  const dayIdx = diffDays(start, today);
  const currentWeek = Math.floor(Math.max(0, dayIdx) / 7);
  const weeks: { week: number; from: string; to: string; titles: Title[] }[] = [];

  for (let w = 0; w <= Math.min(currentWeek, 10); w++) {
    const from = addDays(start, w * 7);
    const to = addDays(start, w * 7 + 6);
    const pFrom = addDays(start, (w - 1) * 7);
    const inW = (d: string, a = from, b = to) => d >= a && d <= b;
    const count = (rows: Row[], uid: number, f: (r: Row) => boolean) => rows.filter((r) => Number(r.user_id) === uid && f(r)).length;

    const metric = (fn: (uid: number) => number) => {
      const scores = users.map((u) => ({ u, s: fn(u) }));
      const max = Math.max(0, ...scores.map((x) => x.s));
      return { winners: max > 0 ? scores.filter((x) => x.s === max).map((x) => x.u) : [], score: max };
    };
    const perfect = (uid: number, a: string, b: string) => (perfectBy.get(uid) || []).filter((d) => d >= a && d <= b).length;

    const defs: [string, string, string, string, (uid: number) => number][] = [
      ["consistency", "👑", "Consistency Queen", "Le plus de journées parfaites", (u) => perfect(u, from, to)],
      ["comeback", "🔥", "Comeback of the Week", "Le plus gros progrès vs la semaine d'avant",
        (u) => (w === 0 ? 0 : perfect(u, from, to) - perfect(u, pFrom, addDays(from, -1)))],
      ["selfcare", "💅", "Self-Care CEO", "Le plus de self-care", (u) => count(checks, u, (r) => inW(r.date) && r.category === "selfcare")],
      ["quran", "🌙", "Soul Glow", "Le plus régulière sur le Coran", (u) => count(checks, u, (r) => inW(r.date) && r.category === "quran")],
      ["sport", "💪", "Gym Baddie", "Le plus de sport", (u) => count(checks, u, (r) => inW(r.date) && r.category === "sport")],
      ["main", "🎬", "Main Character Moment", "Le plus d'updates dans le Tea", (u) => count(posts, u, (r) => inW(r.date))],
      ["hype", "📣", "Hype Girl Award", "Celle qui a le plus encouragé les autres", (u) => count(hype, u, (r) => inW(r.date))],
    ];
    weeks.push({
      week: w, from, to,
      titles: defs.map(([key, emoji, title, desc, fn]) => ({ key, emoji, title, desc, ...metric(fn) })),
    });
  }
  return { start, currentWeek, weeks, users: Object.fromEntries(await usersMap()) };
}
