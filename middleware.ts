import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

const PUBLIC = ["/login", "/api/auth/login", "/manifest.webmanifest", "/sw.js", "/offline", "/icon"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const s = await verifySession(req.cookies.get(COOKIE)?.value);
  if (!s) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname.startsWith("/admin") && s.role !== "admin") return NextResponse.redirect(new URL("/club", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|favicon.ico|.*\\.png$|.*\\.svg$|fonts|.*\\.mp3$).*)"],
};
