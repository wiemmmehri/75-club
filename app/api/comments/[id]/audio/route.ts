import { guard } from "@/lib/auth";
import { dataUrlToResponse, one } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const c = await one<{ audio: string | null }>("SELECT audio FROM comments WHERE id = ?", [Number(params.id)]);
    return dataUrlToResponse(c?.audio ?? null);
  });
}
