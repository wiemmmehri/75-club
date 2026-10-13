import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/auth";
import { run } from "@/lib/db";
import { isValidDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  return guard(async () => {
    const { start_date } = await req.json();
    if (!isValidDate(start_date)) return bad("Date invalide.");
    await run("INSERT INTO settings (key, value) VALUES ('start_date', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [start_date]);
    return NextResponse.json({ ok: true });
  }, { admin: true });
}
