import "server-only";
import { all, miniUser, run, type UserRow } from "./db";

export type FeedPost = {
  id: number; kind: string; text: string | null; hasImage: boolean; created_at: string; date: string | null;
  user: ReturnType<typeof miniUser>;
  reactions: Record<string, number[]>;
  comments: { id: number; text: string; created_at: string; user: ReturnType<typeof miniUser> }[];
};

export async function usersMap() {
  const users = await all<UserRow>("SELECT * FROM users");
  return new Map(users.map((u) => [Number(u.id), miniUser(u)]));
}

export async function loadPosts(opts: { userId?: number; limit?: number; before?: number; withImageOnly?: boolean } = {}): Promise<FeedPost[]> {
  const where: string[] = [];
  const args: (number | string)[] = [];
  if (opts.userId) { where.push("user_id = ?"); args.push(opts.userId); }
  if (opts.before) { where.push("id < ?"); args.push(opts.before); }
  if (opts.withImageOnly) where.push("image IS NOT NULL");
  args.push(opts.limit || 30);
  const posts = await all<{ id: number; user_id: number; kind: string; text: string | null; img: number; created_at: string; date: string | null }>(
    `SELECT id, user_id, kind, text, (image IS NOT NULL) AS img, created_at, date FROM posts
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC LIMIT ?`, args
  );
  if (!posts.length) return [];
  const ids = posts.map((p) => Number(p.id));
  const ph = ids.map(() => "?").join(",");
  const reacts = await all<{ post_id: number; user_id: number; emoji: string }>(`SELECT post_id, user_id, emoji FROM reactions WHERE post_id IN (${ph})`, ids);
  const comms = await all<{ id: number; post_id: number; user_id: number; text: string; created_at: string }>(
    `SELECT id, post_id, user_id, text, created_at FROM comments WHERE post_id IN (${ph}) ORDER BY id ASC`, ids
  );
  const um = await usersMap();
  return posts.map((p) => {
    const reactions: Record<string, number[]> = {};
    for (const r of reacts) if (Number(r.post_id) === Number(p.id)) (reactions[r.emoji] ||= []).push(Number(r.user_id));
    return {
      id: Number(p.id), kind: p.kind, text: p.text, hasImage: Number(p.img) === 1, created_at: p.created_at, date: p.date,
      user: um.get(Number(p.user_id))!,
      reactions,
      comments: comms.filter((c) => Number(c.post_id) === Number(p.id)).map((c) => ({
        id: Number(c.id), text: c.text, created_at: c.created_at, user: um.get(Number(c.user_id))!,
      })),
    };
  }).filter((p) => p.user);
}

/** Automatic post (day completed, wheel result…). `tag` makes it idempotent. */
export async function autoPost(userId: number, kind: string, text: string, tag: string, date?: string) {
  await run("INSERT OR IGNORE INTO posts (user_id, kind, text, tag, date) VALUES (?, ?, ?, ?, ?)", [userId, kind, text, tag, date || null]);
}
