import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { mediaData, run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const POSES = ["front", "side", "back"];

/** One photo per pose and per day: a new one replaces the old one. */
export async function POST(req: Request) {
  return guard(async (s) => {
    const b = await req.json();
    if (!isValidDate(b.date)) return bad("Date invalide.");
    const pose = POSES.includes(b.pose) ? b.pose : "front";
    const data = mediaData(b.data, "image");
    if (!data) return bad("Image invalide ou trop lourde.");
    await run("DELETE FROM body_photos WHERE user_id = ? AND date = ? AND pose = ?", [s.uid, b.date, pose]);
    await run("INSERT INTO body_photos (user_id, date, pose, data) VALUES (?, ?, ?, ?)", [s.uid, b.date, pose, data]);
    return NextResponse.json({ ok: true });
  });
}
