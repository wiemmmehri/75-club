import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { guard, bad } from "@/lib/auth";
import { all, one, run, publicUser, type UserRow } from "@/lib/db";
import { isValidDate } from "@/lib/dates";
import { progressFor } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const today = new URL(req.url).searchParams.get("today");
    if (!isValidDate(today)) return bad("Date invalide.");
    const id = Number(params.id);
    const u = await one<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
    if (!u) return bad("Compte introuvable.", 404);
    const photos = await all("SELECT id, date, kind FROM photos WHERE user_id = ? ORDER BY date ASC, id ASC", [id]);
    const progress = await progressFor(id, today);
    return NextResponse.json({ user: publicUser(u), goals: progress.goals, progress: { ...progress, days: progress.days.map(({ note: _n, ...d }) => d) }, photos: photos.map((p) => ({ ...p, id: Number(p.id) })) });
  }, { admin: true });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const b = await req.json();
    const sets: string[] = [];
    const args: (string | number)[] = [];
    if (typeof b.name === "string" && b.name.trim()) { sets.push("name = ?"); args.push(b.name.trim().slice(0, 30)); }
    if (typeof b.email === "string" && /.+@.+\..+/.test(b.email)) { sets.push("email = ?"); args.push(b.email.trim().toLowerCase()); }
    if (typeof b.password === "string" && b.password) {
      if (b.password.length < 6) return bad("Mot de passe : 6 caractères minimum.");
      sets.push("password_hash = ?"); args.push(bcrypt.hashSync(b.password, 10));
    }
    if (!sets.length) return bad("Rien à modifier.");
    args.push(Number(params.id));
    try { await run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, args); }
    catch (e) { if (String(e).includes("UNIQUE")) return bad("Cet email est déjà utilisé."); throw e; }
    return NextResponse.json({ ok: true });
  }, { admin: true });
}
