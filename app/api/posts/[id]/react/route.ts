import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { REACTIONS } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    const { emoji } = await req.json();
    if (!REACTIONS.includes(emoji)) return bad("Réaction inconnue.");
    const id = Number(params.id);
    const has = await one("SELECT 1 FROM reactions WHERE post_id = ? AND user_id = ? AND emoji = ?", [id, s.uid, emoji]);
    if (has) await run("DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND emoji = ?", [id, s.uid, emoji]);
    else await run("INSERT INTO reactions (post_id, user_id, emoji) VALUES (?, ?, ?)", [id, s.uid, emoji]);
    return NextResponse.json({ on: !has });
  });
}
