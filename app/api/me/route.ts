import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { all, getStart, one, run, publicUser, type UserRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async (s) => {
    const u = await one<UserRow>("SELECT * FROM users WHERE id = ?", [s.uid]);
    if (!u) return bad("Compte introuvable.", 404);
    const goals = await all("SELECT id, category, title, emoji, color FROM missions WHERE user_id = ? AND archived = 0 ORDER BY position, id", [s.uid]);
    return NextResponse.json({ user: publicUser(u), goals, start: await getStart() });
  });
}

const TEXT_FIELDS: Record<string, number> = { name: 30, emoji: 8, nickname: 40, signature: 80, era: 60, motivation: 400 };

export async function PUT(req: Request) {
  return guard(async (s) => {
    const b = await req.json();
    const sets: string[] = [];
    const args: (string | number)[] = [];
    for (const [k, max] of Object.entries(TEXT_FIELDS)) {
      if (typeof b[k] === "string") {
        const v = b[k].trim().slice(0, max);
        if ((k === "name" || k === "emoji") && !v) continue;
        sets.push(`${k} = ?`); args.push(v);
      }
    }
    if (typeof b.color === "string" && /^#[0-9a-fA-F]{6}$/.test(b.color)) { sets.push("color = ?"); args.push(b.color); }
    if (b.onboarded === true) sets.push("onboarded = 1");
    if (!sets.length) return bad("Rien à modifier.");
    args.push(s.uid);
    await run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, args);
    return NextResponse.json({ ok: true });
  });
}
