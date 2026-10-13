import { guard } from "@/lib/auth";
import { dataUrlToResponse, one } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const p = await one<{ image: string | null }>("SELECT image FROM posts WHERE id = ?", [Number(params.id)]);
    return dataUrlToResponse(p?.image ?? null);
  });
}
