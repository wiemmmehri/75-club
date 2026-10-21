import { guard } from "@/lib/auth";
import { dataUrlToResponse, one } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Punishment proofs: visible by the whole club. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const m = await one<{ data: string }>("SELECT data FROM post_media WHERE id = ?", [Number(params.id)]);
    return dataUrlToResponse(m?.data ?? null);
  });
}
