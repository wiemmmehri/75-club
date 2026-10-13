import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { one, type UserRow } from "@/lib/db";
import { COOKIE, signSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email et mot de passe obligatoires." }, { status: 400 });
    const u = await one<UserRow>("SELECT * FROM users WHERE email = ?", [String(email).trim().toLowerCase()]);
    if (!u || !bcrypt.compareSync(String(password), u.password_hash)) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    }
    const res = NextResponse.json({ role: u.role, onboarded: Number(u.onboarded) === 1, name: u.name });
    res.cookies.set(COOKIE, await signSession({ uid: Number(u.id), role: u.role }), {
      httpOnly: true, sameSite: "lax", secure: new URL(req.url).protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 180,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
