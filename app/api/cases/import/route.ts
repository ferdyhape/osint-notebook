import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { importCase, parseCaseImport } from "@/lib/import";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "That file isn't valid JSON" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseCaseImport(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "That doesn't look like a case export" },
      { status: 400 }
    );
  }

  const result = await importCase(user.id, parsed);
  return NextResponse.json(result, { status: 201 });
}
