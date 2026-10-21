import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { mediaData, one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Proof of a punishment. Media are sent one by one (`add`) so a big photo never hits the request limit,
 * then `finish` stamps it as done.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    const id = Number(params.id);
    const p = await one<{ user_id: number; kind: string; status: string | null }>("SELECT user_id, kind, status FROM posts WHERE id = ?", [id]);
    if (!p || p.kind !== "wheel") return bad("Punition introuvable.", 404);
    if (Number(p.user_id) !== s.uid) return bad("Ce n'est pas ta punition 👀", 403);
    if (p.status !== "pending") return bad("Déjà prouvée ✅");
    const b = await req.json();
    if (b.action === "add") {
      const kind = b.kind === "audio" ? "audio" : "image";
      const data = mediaData(b.data, kind, kind === "audio" ? 2_000_000 : 3_000_000);
      if (!data) return bad(kind === "audio" ? "Vocal invalide ou trop long." : "Image invalide ou trop lourde.");
      const n = await one<{ n: number }>("SELECT COUNT(*) AS n FROM post_media WHERE post_id = ?", [id]);
      if (Number(n?.n) >= 6) return bad("6 preuves max, on te croit 😌");
      await run("INSERT INTO post_media (post_id, user_id, kind, data) VALUES (?, ?, ?, ?)", [id, s.uid, kind, data]);
      return NextResponse.json({ ok: true });
    }
    if (b.action === "finish") {
      const text = String(b.text || "").trim().slice(0, 500) || null;
      const n = await one<{ n: number }>("SELECT COUNT(*) AS n FROM post_media WHERE post_id = ?", [id]);
      if (!text && !Number(n?.n)) return bad("Ajoute une photo, un vocal ou un petit mot comme preuve.");
      await run("UPDATE posts SET status = 'done', proof_text = ?, done_at = datetime('now') WHERE id = ?", [text, id]);
      return NextResponse.json({ ok: true });
    }
    return bad("Action inconnue.");
  });
}
