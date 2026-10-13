import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { dataUrlToResponse, one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    const p = await one<{ user_id: number; data: string }>("SELECT user_id, data FROM photos WHERE id = ?", [Number(params.id)]);
    if (!p) return bad("Photo introuvable.", 404);
    if (Number(p.user_id) !== s.uid && s.role !== "admin") return bad("Photo privée 🔒", 403);
    return dataUrlToResponse(p.data);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    await run("DELETE FROM photos WHERE id = ? AND user_id = ?", [Number(params.id), s.uid]);
    return NextResponse.json({ ok: true });
  });
}
