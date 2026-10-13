import { guard } from "@/lib/auth";
import { dataUrlToResponse, one } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return guard(async () => {
    const u = await one<{ avatar: string | null }>("SELECT avatar FROM users WHERE id = ?", [Number(params.id)]);
    return dataUrlToResponse(u?.avatar ?? null);
  });
}
