import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { isValidDate } from "@/lib/dates";
import { weeklyTitles } from "@/lib/awards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return guard(async () => {
    const today = new URL(req.url).searchParams.get("today");
    if (!isValidDate(today)) return bad("Date invalide.");
    return NextResponse.json(await weeklyTitles(today));
  });
}
