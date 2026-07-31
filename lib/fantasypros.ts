/**
 * FantasyPros integration — the forward-looking half of the app.
 *
 * Everything else here is backward-looking (2025 results). This supplies
 * market consensus and projections for the season ahead, which is what
 * dynasty decisions actually turn on.
 *
 * Auth: `x-api-key` header, server-side only. The key must never reach the
 * client bundle, so nothing in this file may be imported into a "use client"
 * component.
 *
 * Joins to Sleeper via the DynastyProcess crosswalk:
 *   - rankings   → `player_id` in the response === `fantasypros_id` (72.6% coverage)
 *   - projections→ `mflid` === `mfl_id` (100% coverage), `fpid` as fallback
 *
 * Verified against the published OpenAPI spec: the spec's own rankings example
 * uses player_id 19217 for Jonathan Taylor, which matches his fantasypros_id
 * in the crosswalk.
 */

import { getCrosswalkRaw } from "./nflverse";

const BASE = "https://api.fantasypros.com/public/v2/json";
const HOUR = 60 * 60 * 1000;

/** Season to request rankings and projections for (the upcoming season). */
export const FP_SEASON = process.env.FANTASYPROS_SEASON ?? "2026";

type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<unknown>>();

function apiKey(): string | null {
  return process.env.FANTASYPROS_API_KEY ?? null;
}

export function hasFantasyPros(): boolean {
  return apiKey() != null;
}

async function fpFetch<T>(path: string, ttlMs: number): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;

  const hit = cache.get(path);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.value as T;

  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-api-key": key, accept: "application/json" },
    next: { revalidate: Math.max(1, Math.floor(ttlMs / 1000)) }
  });
  if (!res.ok) {
    throw new Error(`FantasyPros ${path} → ${res.status} ${res.statusText}`);
  }
  const value = (await res.json()) as T;
  cache.set(path, { value, expires: now + ttlMs });
  return value;
}

/* ---------------------------- rankings ---------------------------- */

interface FpRankingPlayer {
  player_id: number;
  player_name: string;
  player_team_id: string;
  player_positions: string;
  player_position_id?: string;
  rank_ecr: number | string;
  pos_rank: string;
  tier?: number;
  player_ecr_delta?: number | null;
}

interface FpRankingsResponse {
  players: FpRankingPlayer[];
}

export interface ConsensusRank {
  /** Expert consensus rank, overall. */
  ecr: number | null;
  /** Positional rank string, e.g. "RB4". */
  pos_rank: string | null;
  /** Tier grouping — players within a tier are ~interchangeable. */
  tier: number | null;
  /** Rank movement since last update; negative = rising. */
  delta: number | null;
  name: string;
  team: string | null;
}

const toNum = (v: number | string | null | undefined): number | null => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Consensus rankings keyed by Sleeper player_id.
 *
 * `position=OP` is FantasyPros' "Offensive Player" set — i.e. superflex,
 * which is what this league is. `type=DYNASTY` for the dynasty board,
 * `ROOKIES` for the rookie draft board.
 */
async function rankingsBySleeper(
  type: "DYNASTY" | "ROOKIES",
  season = FP_SEASON
): Promise<Map<string, ConsensusRank>> {
  const out = new Map<string, ConsensusRank>();
  try {
    const [data, crosswalk] = await Promise.all([
      fpFetch<FpRankingsResponse>(
        `/nfl/${season}/consensus-rankings?position=OP&type=${type}&scoring=PPR`,
        6 * HOUR
      ),
      getCrosswalkRaw()
    ]);
    if (!data?.players) return out;

    // fantasypros_id → sleeper_id
    const fpToSleeper = new Map<string, string>();
    for (const e of crosswalk) {
      if (e.fantasypros_id) fpToSleeper.set(e.fantasypros_id, e.sleeper_id);
    }

    for (const p of data.players) {
      const sleeperId = fpToSleeper.get(String(p.player_id));
      if (!sleeperId) continue;
      out.set(sleeperId, {
        ecr: toNum(p.rank_ecr),
        pos_rank: p.pos_rank ?? null,
        tier: p.tier ?? null,
        delta: p.player_ecr_delta ?? null,
        name: p.player_name,
        team: p.player_team_id ?? null
      });
    }
  } catch {
    // degrade silently — the app is fully usable without FantasyPros
  }
  return out;
}

export const getDynastyRanks = (season?: string) =>
  rankingsBySleeper("DYNASTY", season);
export const getRookieRanks = (season?: string) =>
  rankingsBySleeper("ROOKIES", season);

/* --------------------------- projections --------------------------- */

interface FpProjectionPlayer {
  fpid: string;
  mflid: string;
  name: string;
  position_id: string;
  team_id: string;
  stats: Array<Record<string, number>>;
}

interface FpProjectionsResponse {
  players: FpProjectionPlayer[];
}

export interface Projection {
  name: string;
  position: string | null;
  team: string | null;
  /** Projected full-PPR points for the season. */
  points_ppr: number | null;
  pass_att: number | null;
  pass_yds: number | null;
  pass_tds: number | null;
  pass_ints: number | null;
  rush_att: number | null;
  rush_yds: number | null;
  rush_tds: number | null;
  rec: number | null;
  rec_yds: number | null;
  rec_tds: number | null;
}

const s = (row: Record<string, number> | undefined, k: string): number | null => {
  const v = row?.[k];
  return typeof v === "number" && Number.isFinite(v)
    ? Math.round(v * 10) / 10
    : null;
};

/**
 * Season projections keyed by Sleeper player_id.
 *
 * week=0 requests preseason (full-season) projections. Joins on mfl_id first
 * since the crosswalk has that for 100% of players, falling back to fpid.
 */
export async function getProjections(
  season = FP_SEASON
): Promise<Map<string, Projection>> {
  const out = new Map<string, Projection>();
  try {
    const [data, crosswalk] = await Promise.all([
      fpFetch<FpProjectionsResponse>(
        `/nfl/${season}/projections?position=ALL&week=0`,
        6 * HOUR
      ),
      getCrosswalkRaw()
    ]);
    if (!data?.players) return out;

    const mflToSleeper = new Map<string, string>();
    const fpToSleeper = new Map<string, string>();
    for (const e of crosswalk) {
      if (e.mfl_id) mflToSleeper.set(e.mfl_id, e.sleeper_id);
      if (e.fantasypros_id) fpToSleeper.set(e.fantasypros_id, e.sleeper_id);
    }

    for (const p of data.players) {
      const sleeperId =
        (p.mflid && mflToSleeper.get(String(p.mflid))) ||
        (p.fpid && fpToSleeper.get(String(p.fpid)));
      if (!sleeperId) continue;

      const row = p.stats?.[0];
      out.set(sleeperId, {
        name: p.name,
        position: p.position_id ?? null,
        team: p.team_id ?? null,
        points_ppr: s(row, "points_ppr"),
        pass_att: s(row, "pass_att"),
        pass_yds: s(row, "pass_yds"),
        pass_tds: s(row, "pass_tds"),
        pass_ints: s(row, "pass_ints"),
        rush_att: s(row, "rush_att"),
        rush_yds: s(row, "rush_yds"),
        rush_tds: s(row, "rush_tds"),
        rec: s(row, "rec_rec"),
        rec_yds: s(row, "rec_yds"),
        rec_tds: s(row, "rec_tds")
      });
    }
  } catch {
    // degrade silently
  }
  return out;
}
