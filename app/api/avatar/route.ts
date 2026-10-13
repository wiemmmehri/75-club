import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return guard(async (s) => {
    const { data } = await req.json();
    if (data === null) { await run("UPDATE users SET avatar = NULL WHERE id = ?", [s.uid]); return NextResponse.json({ ok: true }); }
    if (typeof data !== "string" || !data.startsWith("data:image/") || data.length > 1_500_000) return bad("Image invalide ou trop lourde.");
    await run("UPDATE users SET avatar = ? WHERE id = ?", [data, s.uid]);
    return NextResponse.json({ ok: true });
  });
}
