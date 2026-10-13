import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { guard, bad } from "@/lib/auth";
import { one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return guard(async (s) => {
    const { current, next } = await req.json();
    if (typeof next !== "string" || next.length < 6) return bad("Le nouveau mot de passe doit faire au moins 6 caractères.");
    const u = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [s.uid]);
    if (!u || !bcrypt.compareSync(String(current || ""), u.password_hash)) return bad("Mot de passe actuel incorrect.");
    await run("UPDATE users SET password_hash = ? WHERE id = ?", [bcrypt.hashSync(next, 10), s.uid]);
    return NextResponse.json({ ok: true });
  });
}
