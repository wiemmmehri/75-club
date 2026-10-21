import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { dataUrlToResponse, one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Goal proofs are shared with the club (that's the point). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const p = await one<{ data: string }>("SELECT data FROM check_photos WHERE id = ?", [Number(params.id)]);
    return dataUrlToResponse(p?.data ?? null);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return guard(async (s) => {
    await run("DELETE FROM check_photos WHERE id = ? AND user_id = ?", [Number(params.id), s.uid]);
    return NextResponse.json({ ok: true });
  });
}
