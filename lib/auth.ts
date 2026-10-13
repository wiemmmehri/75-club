import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, verifySession, type Session } from "./session";

export async function getSession() {
  return verifySession(cookies().get(COOKIE)?.value);
}

type Handler = (s: Session) => Promise<Response>;

/** Wraps a route handler: 401 if not logged in, 403 if admin required. */
export async function guard(fn: Handler, opts: { admin?: boolean } = {}) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
  if (opts.admin && s.role !== "admin") return NextResponse.json({ error: "Réservé à l'admin." }, { status: 403 });
  try {
    return await fn(s);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as Error).message || "Erreur serveur." }, { status: 500 });
  }
}

export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
