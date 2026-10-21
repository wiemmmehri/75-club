import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { mediaData, one, run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** A photo that proves a goal was done that day. One request per photo. */
export async function POST(req: Request) {
  return guard(async (s) => {
    const b = await req.json();
    if (!isValidDate(b.date)) return bad("Date invalide.");
    const m = await one("SELECT id FROM missions WHERE id = ? AND user_id = ?", [Number(b.mission), s.uid]);
    if (!m) return bad("Objectif inconnu.");
    const data = mediaData(b.data, "image");
    if (!data) return bad("Image invalide ou trop lourde.");
    const n = await one<{ n: number }>("SELECT COUNT(*) AS n FROM check_photos WHERE user_id = ? AND date = ? AND mission_id = ?", [s.uid, b.date, Number(b.mission)]);
    if (Number(n?.n) >= 4) return bad("4 photos max par objectif 📸");
    const r = await run("INSERT INTO check_photos (user_id, date, mission_id, data) VALUES (?, ?, ?, ?)", [s.uid, b.date, Number(b.mission), data]);
    return NextResponse.json({ id: Number(r.lastInsertRowid) });
  });
}
