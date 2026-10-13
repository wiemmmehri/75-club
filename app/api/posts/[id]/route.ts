import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    const id = Number(params.id);
    const r = s.role === "admin"
      ? await run("DELETE FROM posts WHERE id = ?", [id])
      : await run("DELETE FROM posts WHERE id = ? AND user_id = ?", [id, s.uid]);
    if (r.rowsAffected) {
      await run("DELETE FROM reactions WHERE post_id = ?", [id]);
      await run("DELETE FROM comments WHERE post_id = ?", [id]);
    }
    return NextResponse.json({ ok: true });
  });
}
