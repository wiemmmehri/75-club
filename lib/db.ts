import "server-only";
import { createClient, type Client, type InValue } from "@libsql/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { SEED_ACCOUNTS } from "@/config/accounts";

let client: Client | null = null;
let ready: Promise<void> | null = null;

function makeClient(): Client {
  // CLUB_DB_* first: the Vercel Turso integration rewrites TURSO_* for every deployment
  const url = process.env.CLUB_DB_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.CLUB_DB_URL ? process.env.CLUB_DB_TOKEN : process.env.TURSO_AUTH_TOKEN;
  if (url) return createClient({ url, authToken });
  if (process.env.VERCEL) throw new Error("TURSO_DATABASE_URL manquant : configure une base Turso dans Vercel.");
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return createClient({ url: "file:" + path.join(dir, "club75.db") });
}

async function init(c: Client) {
  await c.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      name TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '🎀', role TEXT NOT NULL DEFAULT 'user',
      nickname TEXT, signature TEXT, era TEXT, color TEXT NOT NULL DEFAULT '#FF3D7F',
      avatar TEXT, motivation TEXT, onboarded INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS missions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      category TEXT NOT NULL, title TEXT NOT NULL, emoji TEXT NOT NULL, color TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS mission_checks (user_id INTEGER NOT NULL, date TEXT NOT NULL, mission_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, date, mission_id))`,
    `CREATE TABLE IF NOT EXISTS day_totals (user_id INTEGER NOT NULL, date TEXT NOT NULL, total INTEGER NOT NULL,
      PRIMARY KEY (user_id, date))`,
    `CREATE TABLE IF NOT EXISTS days (user_id INTEGER NOT NULL, date TEXT NOT NULL, mood TEXT, note TEXT,
      water INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, date))`,
    `CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      date TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'progress', data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      kind TEXT NOT NULL DEFAULT 'post', text TEXT, image TEXT, tag TEXT UNIQUE, date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS reactions (post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, emoji TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (post_id, user_id, emoji))`,
    `CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS spins (user_id INTEGER NOT NULL, date TEXT NOT NULL, result TEXT NOT NULL,
      PRIMARY KEY (user_id, date))`,
    // proofs attached to a post (punishment done: photos, voice notes)
    `CREATE TABLE IF NOT EXISTS post_media (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    // photo proofs for a goal on a given day (visible by the club)
    `CREATE TABLE IF NOT EXISTS check_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      date TEXT NOT NULL, mission_id INTEGER NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    // body journal (private)
    `CREATE TABLE IF NOT EXISTS body_profile (user_id INTEGER PRIMARY KEY, height REAL, goal REAL)`,
    `CREATE TABLE IF NOT EXISTS body_logs (user_id INTEGER NOT NULL, date TEXT NOT NULL, weight REAL, waist REAL, hips REAL,
      chest REAL, arm REAL, thigh REAL, note TEXT, PRIMARY KEY (user_id, date))`,
    `CREATE TABLE IF NOT EXISTS body_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      date TEXT NOT NULL, pose TEXT NOT NULL DEFAULT 'front', data TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS check_photos_day ON check_photos (user_id, date)`,
    `CREATE INDEX IF NOT EXISTS post_media_post ON post_media (post_id)`,
  ], "write");
  // columns added after the first release: ADD COLUMN fails if it already exists, that's fine
  for (const sql of [
    "ALTER TABLE posts ADD COLUMN status TEXT",
    "ALTER TABLE posts ADD COLUMN proof_text TEXT",
    "ALTER TABLE posts ADD COLUMN done_at TEXT",
    "ALTER TABLE comments ADD COLUMN audio TEXT",
  ]) await c.execute(sql).catch(() => {});
  const res = await c.execute("SELECT COUNT(*) AS n FROM users");
  if (Number(res.rows[0].n) === 0) {
    for (const a of SEED_ACCOUNTS) {
      await c.execute({
        sql: `INSERT INTO users (email, password_hash, name, emoji, role, nickname, signature, color, onboarded)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [a.email.toLowerCase(), bcrypt.hashSync(a.password, 10), a.name, a.emoji, a.role, a.nickname, a.signature, a.color, a.role === "admin" ? 1 : 0],
      });
    }
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    await c.execute({ sql: "INSERT OR IGNORE INTO settings (key, value) VALUES ('start_date', ?)", args: [today] });
  }
}

export async function db(): Promise<Client> {
  if (!client) client = makeClient();
  if (!ready) ready = init(client).catch((e) => { ready = null; throw e; });
  await ready;
  return client;
}

export async function all<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T[]> {
  const r = await (await db()).execute({ sql, args });
  return r.rows.map((row) => ({ ...row })) as T[];
}
export async function one<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T | null> {
  return (await all<T>(sql, args))[0] ?? null;
}
export async function run(sql: string, args: InValue[] = []) {
  return (await db()).execute({ sql, args });
}

export async function getStart(): Promise<string> {
  const r = await one<{ value: string }>("SELECT value FROM settings WHERE key = 'start_date'");
  return r?.value || new Date().toISOString().slice(0, 10);
}

/** Accepts a base64 data URL of the given family (image / audio) under a size limit. */
export function mediaData(v: unknown, family: "image" | "audio", max = 3_000_000): string | null {
  if (typeof v !== "string" || !v.startsWith(`data:${family}/`) || !v.includes(";base64,")) return null;
  return v.length <= max ? v : null;
}

export type UserRow = {
  id: number; email: string; password_hash: string; name: string; emoji: string; role: "admin" | "user";
  nickname: string | null; signature: string | null; era: string | null; color: string; avatar: string | null;
  motivation: string | null; onboarded: number;
};

export function publicUser(u: UserRow) {
  return {
    id: Number(u.id), email: u.email, name: u.name, emoji: u.emoji, role: u.role, nickname: u.nickname,
    signature: u.signature, era: u.era, color: u.color, avatarV: u.avatar ? u.avatar.length : 0, motivation: u.motivation,
    onboarded: Number(u.onboarded),
  };
}

/** Light user object for feeds & cards (no email). */
export function miniUser(u: UserRow) {
  return { id: Number(u.id), name: u.name, emoji: u.emoji, color: u.color, nickname: u.nickname, avatarV: u.avatar ? u.avatar.length : 0 };
}

export function dataUrlToResponse(data: string | null) {
  const m = data ? /^data:([^;,]+)[^,]*;base64,(.*)$/.exec(data) : null;
  if (!m) return new Response("Introuvable", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "private, max-age=86400" },
  });
}
