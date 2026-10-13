import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    const { text } = await req.json();
    const t = String(text || "").trim().slice(0, 500);
    if (!t) return bad("Commentaire vide.");
    await run("INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)", [Number(params.id), s.uid, t]);
    return NextResponse.json({ ok: true });
  });
}
