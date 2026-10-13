import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { run } from "@/lib/db";
import { loadPosts } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return guard(async () => {
    const q = new URL(req.url).searchParams;
    const posts = await loadPosts({
      userId: q.get("user") ? Number(q.get("user")) : undefined,
      before: q.get("before") ? Number(q.get("before")) : undefined,
      withImageOnly: q.get("images") === "1",
      limit: 30,
    });
    return NextResponse.json({ posts });
  });
}

export async function POST(req: Request) {
  return guard(async (s) => {
    const b = await req.json();
    const text = String(b.text || "").trim().slice(0, 1000);
    const image = typeof b.image === "string" && b.image.startsWith("data:image/") ? b.image : null;
    if (image && image.length > 3_000_000) return bad("Image trop lourde.");
    if (!text && !image) return bad("Écris quelque chose ou ajoute une photo.");
    const kind = b.kind === "sos" ? "sos" : "post";
    await run("INSERT INTO posts (user_id, kind, text, image) VALUES (?, ?, ?, ?)", [s.uid, kind, text || null, image]);
    return NextResponse.json({ ok: true });
  });
}
