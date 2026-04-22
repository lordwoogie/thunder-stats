import { NextResponse } from "next/server";
import { getAllPlayers, getTrending } from "@/lib/sleeper";

export const revalidate = 3600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "add") as "add" | "drop";

  try {
    const [trending, players] = await Promise.all([
      getTrending(type, 24, 25),
      getAllPlayers()
    ]);

    const enriched = trending.map((t) => {
      const p = players[t.player_id];
      return {
        player_id: t.player_id,
        count: t.count,
        name: p?.full_name ?? t.player_id,
        position: p?.position ?? "—",
        team: p?.team ?? "FA",
        age: p?.age ?? null,
        injury_status: p?.injury_status ?? null
      };
    });

    return NextResponse.json({ type, players: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
