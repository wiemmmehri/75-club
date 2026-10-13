import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { one, publicUser, type UserRow } from "@/lib/db";
import { isValidDate } from "@/lib/dates";
import { progressFor } from "@/lib/progress";
import { loadPosts } from "@/lib/feed";

export const dynamic = "force-dynamic";

/** A girl's public profile: card, missions, stats, what she shared. Her journal stays private. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const today = new URL(req.url).searchParams.get("today");
    if (!isValidDate(today)) return bad("Date invalide.");
    const id = Number(params.id);
    const u = await one<UserRow>("SELECT * FROM users WHERE id = ? AND role = 'user'", [id]);
    if (!u) return bad("Introuvable.", 404);
    const { email: _e, motivation: _m, ...user } = publicUser(u);
    void _e; void _m;
    const p = await progressFor(id, today);
    const posts = await loadPosts({ userId: id, limit: 20 });
    return NextResponse.json({
      user, goals: p.goals, stats: { ...p.stats, byDate: p.stats.byDate }, tier: p.tier,
      badges: p.badges, start: p.start, posts,
    });
  });
}
