import { NextResponse } from "next/server";
import { buildLeagueBundle } from "@/lib/league-service";

export const revalidate = 3600;

export async function GET() {
  try {
    const bundle = await buildLeagueBundle();
    return NextResponse.json(bundle);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
