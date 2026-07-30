import {
  SleeperLeague,
  SleeperMatchup,
  SleeperPlayers,
  SleeperRoster,
  SleeperTransaction,
  SleeperUser,
  SleeperSeasonStats
} from "./types";
import { LEAGUE_ID, SEASON, SLEEPER_BASE } from "./constants";

/**
 * In-process memory cache. Next.js route handlers share a single Node
 * runtime between warm invocations, so this is sufficient for dev and
 * small-scale production. For a multi-region setup swap in Redis.
 */
type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<unknown>>();

async function fetchJson<T>(
  path: string,
  ttlMs: number
): Promise<T> {
  const key = path;
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && hit.expires > now) {
    return hit.value as T;
  }

  const res = await fetch(`${SLEEPER_BASE}${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate: Math.max(1, Math.floor(ttlMs / 1000)) }
  });

  if (!res.ok) {
    throw new Error(`Sleeper ${path} → ${res.status} ${res.statusText}`);
  }
  const value = (await res.json()) as T;
  cache.set(key, { value, expires: now + ttlMs });
  return value;
}

const HOUR = 60 * 60 * 1000;

export const TTL = {
  league: 6 * HOUR,
  rosters: 1 * HOUR,
  users: 6 * HOUR,
  players: 24 * HOUR,
  stats: 24 * HOUR,
  projections: 6 * HOUR,
  matchups: 1 * HOUR,
  transactions: 1 * HOUR,
  trending: 1 * HOUR
} as const;

export async function getLeague(leagueId = LEAGUE_ID): Promise<SleeperLeague> {
  return fetchJson(`/league/${leagueId}`, TTL.league);
}

export async function getRosters(leagueId = LEAGUE_ID): Promise<SleeperRoster[]> {
  return fetchJson(`/league/${leagueId}/rosters`, TTL.rosters);
}

export async function getUsers(leagueId = LEAGUE_ID): Promise<SleeperUser[]> {
  return fetchJson(`/league/${leagueId}/users`, TTL.users);
}

export async function getAllPlayers(): Promise<SleeperPlayers> {
  return fetchJson("/players/nfl", TTL.players);
}

export async function getSeasonStats(
  season = SEASON
): Promise<SleeperSeasonStats> {
  return fetchJson(`/stats/nfl/regular/${season}`, TTL.stats);
}

export async function getMatchups(
  week: number,
  leagueId = LEAGUE_ID
): Promise<SleeperMatchup[]> {
  return fetchJson(`/league/${leagueId}/matchups/${week}`, TTL.matchups);
}

export async function getTransactions(
  round: number,
  leagueId = LEAGUE_ID
): Promise<SleeperTransaction[]> {
  return fetchJson(`/league/${leagueId}/transactions/${round}`, TTL.transactions);
}

export async function getTrending(
  type: "add" | "drop",
  lookbackHours = 24,
  limit = 25
): Promise<Array<{ player_id: string; count: number }>> {
  return fetchJson(
    `/players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`,
    TTL.trending
  );
}
