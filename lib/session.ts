import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "club75_session";
export type Session = { uid: number; role: "admin" | "user" };

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || "club75-dev-secret-change-me-0123456789-abcdef");

export async function signSession(s: Session) {
  return new SignJWT({ uid: s.uid, role: s.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(secret());
}

export async function verifySession(token?: string | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: Number(payload.uid), role: payload.role === "admin" ? "admin" : "user" };
  } catch {
    return null;
  }
}
