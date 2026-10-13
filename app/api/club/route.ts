import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { all, getStart, miniUser, type UserRow } from "@/lib/db";
import { isValidDate } from "@/lib/dates";
import { tier } from "@/lib/stats";
import { activeMissions, loadTracking, statsFor } from "@/lib/tracking";
import { loadPosts } from "@/lib/feed";

export const dynamic = "force-dynamic";

/** The Clubhouse: everything about the 4 girls at a glance. */
export async function GET(req: Request) {
  return guard(async (s) => {
    const today = new URL(req.url).searchParams.get("today");
    if (!isValidDate(today)) return bad("Date invalide.");
    const start = await getStart();
    const users = await all<UserRow>("SELECT * FROM users WHERE role = 'user' ORDER BY id");
    const t = await loadTracking();
    const girls = users.map((u) => {
      const id = Number(u.id);
      const st = statsFor(t, id, start, today);
      return {
        ...miniUser(u), me: id === s.uid, signature: u.signature, era: u.era,
        goals: activeMissions(t, id).map((m) => ({ id: m.id, color: m.color })),
        today: st.byDate[today] || [], pct: st.pct, streak: st.streak, perfectDays: st.perfectDays, tier: tier(st.perfectDays),
      };
    });
    const sos = (await loadPosts({ limit: 20 })).filter((p) => p.kind === "sos" && Date.now() - new Date(p.created_at.replace(" ", "T") + "Z").getTime() < 86400000);
    const latest = await loadPosts({ limit: 3 });
    return NextResponse.json({ start, girls, sos, latest });
  });
}
