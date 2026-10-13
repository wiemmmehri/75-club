import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { all, getStart, miniUser, type UserRow } from "@/lib/db";
import { isValidDate } from "@/lib/dates";
import { activeMissions, loadTracking, statsFor } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return guard(async () => {
    const today = new URL(req.url).searchParams.get("today");
    if (!isValidDate(today)) return bad("Date invalide.");
    const start = await getStart();
    const users = await all<UserRow>("SELECT * FROM users WHERE role = 'user' ORDER BY id");
    const t = await loadTracking();
    const photos = await all<{ user_id: number; n: number }>("SELECT user_id, COUNT(*) AS n FROM photos GROUP BY user_id");
    return NextResponse.json({
      start,
      users: users.map((u) => {
        const st = statsFor(t, Number(u.id), start, today);
        return {
          ...miniUser(u), email: u.email, onboarded: Number(u.onboarded) === 1,
          photos: Number(photos.find((p) => Number(p.user_id) === Number(u.id))?.n || 0),
          day: st.day, pct: st.pct, streak: st.streak, bestStreak: st.bestStreak, perfectDays: st.perfectDays,
          today: st.byDate[today] || [], goals: activeMissions(t, Number(u.id)).map((m) => ({ id: m.id, color: m.color })), lastActive: st.lastActive,
        };
      }),
    });
  }, { admin: true });
}
