import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { mediaData, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    const { text, audio } = await req.json();
    const t = String(text || "").trim().slice(0, 500);
    const a = mediaData(audio, "audio", 2_000_000);
    if (audio && !a) return bad("Vocal trop long (1 min max).");
    if (!t && !a) return bad("Commentaire vide.");
    await run("INSERT INTO comments (post_id, user_id, text, audio) VALUES (?, ?, ?, ?)", [Number(params.id), s.uid, t, a]);
    return NextResponse.json({ ok: true });
  });
}
