import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { all, run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** Private glow-up photos: only the owner and the admin can see them. */
export async function GET(req: Request) {
  return guard(async (s) => {
    const q = new URL(req.url).searchParams.get("user");
    const uid = s.role === "admin" && q ? Number(q) : s.uid;
    const photos = await all("SELECT id, date, kind FROM photos WHERE user_id = ? ORDER BY date ASC, id ASC", [uid]);
    return NextResponse.json({ photos: photos.map((p) => ({ ...p, id: Number(p.id) })) });
  });
}

export async function POST(req: Request) {
  return guard(async (s) => {
    const b = await req.json();
    if (!isValidDate(b.date)) return bad("Date invalide.");
    if (typeof b.data !== "string" || !b.data.startsWith("data:image/")) return bad("Image invalide.");
    if (b.data.length > 3_000_000) return bad("Image trop lourde.");
    const kind = b.kind === "before" ? "before" : "progress";
    if (kind === "before") await run("DELETE FROM photos WHERE user_id = ? AND kind = 'before'", [s.uid]);
    await run("INSERT INTO photos (user_id, date, kind, data) VALUES (?, ?, ?, ?)", [s.uid, b.date, kind, b.data]);
    return NextResponse.json({ ok: true });
  });
}
