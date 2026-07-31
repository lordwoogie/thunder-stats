import { LEAGUE_MEMBERS } from "./constants";
import { avgAge, enrichPlayer, sortByPPG } from "./enrich";
import { getNflAdvancedBySleeper } from "./nflverse";
import { getSnapSharesBySleeper } from "./snap-counts";
import { buildDepthRooms } from "./depth-charts";
import { getDynastyRanks, getProjections } from "./fantasypros";
import { buildSeasonUsage } from "./usage";
import { SEASON } from "./constants";
import {
  getAllPlayers,
  getLeague,
  getRosters,
  getSeasonStats,
  getUsers
} from "./sleeper";
import { EnrichedPlayer, TeamOverview } from "./types";

export interface LeagueBundle {
  league: Awaited<ReturnType<typeof getLeague>>;
  teams: TeamOverview[];
  fetchedAt: string;
  /** Season the nflverse advanced stats came from, null if unavailable. */
  advancedSeason: string | null;
}

function teamNameFor(
  ownerId: string,
  users: Array<{ user_id: string; display_name: string; metadata?: { team_name?: string } }>
) {
  const u = users.find((x) => x.user_id === ownerId);
  const fallback = LEAGUE_MEMBERS.find((m) => m.user_id === ownerId);
  return {
    display_name: u?.display_name ?? fallback?.display_name ?? "Unknown",
    team_name:
      u?.metadata?.team_name ??
      fallback?.team_name ??
      u?.display_name ??
      "Unnamed Team"
  };
}

export async function buildLeagueBundle(): Promise<LeagueBundle> {
  const [league, rosters, users, players, stats, nfl, snaps, ranks, projections] =
    await Promise.all([
    getLeague(),
    getRosters(),
    getUsers(),
    getAllPlayers(),
    getSeasonStats().catch(() => null),
    getNflAdvancedBySleeper(),
    getSnapSharesBySleeper(),
    getDynastyRanks(),
    getProjections()
  ]);
  const adv = nfl.bySleeper;
  // Derived current-season usage. Sleeper supplies official volume and PPR
  // points; the committed play-by-play aggregate supplies opportunity shares
  // and backfills volume, so the stats page still renders if Sleeper is down.
  const usage = buildSeasonUsage(SEASON, stats, players, snaps, adv);
  // Depth charts come free with the /players/nfl payload we already fetch.
  const depthRooms = buildDepthRooms(players);

  const teams: TeamOverview[] = rosters.map((r) => {
    const names = teamNameFor(r.owner_id, users);
    const starters = (r.starters ?? [])
      .filter((id) => id && id !== "0")
      .map((id) => enrichPlayer(id, players, stats, adv, usage, depthRooms, ranks, projections));
    const starterIds = new Set(starters.map((p) => p.player_id));
    const taxiIds = new Set(r.taxi ?? []);
    const reserveIds = new Set(r.reserve ?? []);
    const bench = (r.players ?? [])
      .filter(
        (id) =>
          !starterIds.has(id) && !taxiIds.has(id) && !reserveIds.has(id)
      )
      .map((id) => enrichPlayer(id, players, stats, adv, usage, depthRooms, ranks, projections));
    const taxi = (r.taxi ?? []).map((id) =>
      enrichPlayer(id, players, stats, adv, usage, depthRooms, ranks, projections)
    );
    const reserve = (r.reserve ?? []).map((id) =>
      enrichPlayer(id, players, stats, adv, usage, depthRooms, ranks, projections)
    );

    const all = [...starters, ...bench, ...taxi, ...reserve];
    const totalFpts = all.reduce((s, p) => s + (p.fpts_2025 ?? 0), 0);

    return {
      roster_id: r.roster_id,
      owner_id: r.owner_id,
      display_name: names.display_name,
      team_name: names.team_name,
      starters,
      bench: bench.sort(sortByPPG),
      taxi,
      reserve,
      total_fpts_2025: Math.round(totalFpts * 10) / 10,
      avg_age: avgAge(all),
      record: {
        wins: r.settings?.wins ?? 0,
        losses: r.settings?.losses ?? 0,
        ties: r.settings?.ties ?? 0
      }
    };
  });

  teams.sort((a, b) => a.roster_id - b.roster_id);

  return {
    league,
    teams,
    fetchedAt: new Date().toISOString(),
    advancedSeason: adv.size > 0 ? nfl.season : null
  };
}

export function flattenRoster(team: TeamOverview): EnrichedPlayer[] {
  return [...team.starters, ...team.bench, ...team.taxi, ...team.reserve];
}
