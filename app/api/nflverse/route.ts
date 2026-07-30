import { NextResponse } from "next/server";
import { getNflAdvancedBySleeper } from "@/lib/nflverse";
import { getAllPlayers } from "@/lib/sleeper";

export const revalidate = 86400;

/**
 * GET /api/nflverse
 *   ?ids=4892,6794      → advanced stats for specific Sleeper player_ids
 *   ?position=WR&limit=25&sort=wopr
 *                       → league-wide leaderboard for a position
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = url.searchParams.get("ids");
  const position = url.searchParams.get("position")?.toUpperCase();
  const sort = url.searchParams.get("sort") ?? "wopr";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 25), 200);

  try {
    const [nfl, players] = await Promise.all([
      getNflAdvancedBySleeper(),
      getAllPlayers()
    ]);

    if (nfl.bySleeper.size === 0) {
      return NextResponse.json(
        { error: "nflverse data unavailable", season: nfl.season },
        { status: 503 }
      );
    }

    const named = (id: string) => {
      const p = players[id];
      return p?.full_name ?? id;
    };

    if (ids) {
      const wanted = ids.split(",").map((s) => s.trim()).filter(Boolean);
      const out = wanted.map((id) => ({
        player_id: id,
        name: named(id),
        stats: nfl.bySleeper.get(id) ?? null
      }));
      return NextResponse.json({ season: nfl.season, players: out });
    }

    const rows = Array.from(nfl.bySleeper.entries())
      .filter(([, s]) => !position || s.position === position)
      .map(([id, s]) => ({ player_id: id, name: named(id), ...s }))
      .sort((a, b) => {
        const key = sort as keyof typeof a;
        const av = typeof a[key] === "number" ? (a[key] as number) : -Infinity;
        const bv = typeof b[key] === "number" ? (b[key] as number) : -Infinity;
        return bv - av;
      })
      .slice(0, limit);

    return NextResponse.json({ season: nfl.season, sort, players: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
