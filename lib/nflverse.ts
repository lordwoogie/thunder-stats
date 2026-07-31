/**
 * nflverse integration.
 *
 * Pulls advanced NFL player stats (target share, WOPR, air-yards share, EPA,
 * etc.) from the open nflverse-data GitHub releases and joins them to Sleeper
 * player_ids via the DynastyProcess ID crosswalk.
 *
 * Pipeline:  Sleeper player_id  →  (crosswalk)  →  gsis_id  →  (stats)  →  advanced line
 *
 * All data is public CSV, no auth, no rate limits. Cached in-process for 24h.
 */

import { SEASON } from "./constants";
import { NflAdvancedStat } from "./types";
import seasonStats2025 from "../data/season-stats-2025.json";

interface PrecomputedFile {
  season: string;
  players: Record<string, Record<string, number | string | null>>;
}

/** Seasons we have a committed play-by-play aggregate for. */
const PRECOMPUTED: Record<string, PrecomputedFile> = {
  "2025": seasonStats2025 as unknown as PrecomputedFile
};

const CROSSWALK_URL =
  "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";

// nflverse-data release; asset naming: stats_player_reg_{season}.csv
const NFLVERSE_STATS_BASE =
  "https://github.com/nflverse/nflverse-data/releases/download/player_stats";

export const DAY = 24 * 60 * 60 * 1000;

type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<unknown>>();

export async function cachedText(url: string, ttlMs: number): Promise<string> {
  const hit = cache.get(url);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.value as string;

  const res = await fetch(url, {
    headers: { accept: "text/csv,*/*" },
    // nflverse release assets 302 to a signed host; fetch follows automatically
    redirect: "follow",
    next: { revalidate: Math.max(1, Math.floor(ttlMs / 1000)) }
  });
  if (!res.ok) throw new Error(`nflverse fetch ${url} → ${res.status}`);
  const text = await res.text();
  cache.set(url, { value: text, expires: now + ttlMs });
  return text;
}

/** RFC-4180-ish line parser: handles double-quoted fields with embedded commas. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { header, rows };
}

function num(v: string | undefined): number | null {
  if (v == null) return null;
  const t = v.trim();
  if (t === "" || t === "NA" || t === "NaN") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function round(n: number | null, dp = 1): number | null {
  if (n == null) return null;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/* --------------------------- crosswalk --------------------------- */

export interface CrosswalkEntry {
  sleeper_id: string;
  gsis_id: string;
  pfr_id: string | null;
  ktc_id: string | null;
  merge_name: string;
  position: string;
  team: string;
}

/**
 * All crosswalk rows that have a sleeper_id, regardless of whether a
 * gsis_id is present. Use this when joining on pfr_id (snap counts);
 * use getCrosswalk() when joining on gsis_id (nflverse stats).
 */
export async function getCrosswalkRaw(): Promise<CrosswalkEntry[]> {
  const text = await cachedText(CROSSWALK_URL, DAY);
  const { header, rows } = parseCsv(text);
  const idx = (name: string) => header.indexOf(name);
  const iSleeper = idx("sleeper_id");
  const iGsis = idx("gsis_id");
  const iPfr = idx("pfr_id");
  const iKtc = idx("ktc_id");
  const iMerge = idx("merge_name");
  const iName = idx("name");
  const iPos = idx("position");
  const iTeam = idx("team");

  const clean = (v: string | undefined) => {
    const t = v?.trim();
    return t && t !== "NA" ? t : null;
  };

  const out: CrosswalkEntry[] = [];
  for (const r of rows) {
    const sleeper = clean(r[iSleeper]);
    if (!sleeper) continue;
    out.push({
      sleeper_id: sleeper,
      gsis_id: clean(r[iGsis]) ?? "",
      pfr_id: clean(r[iPfr]),
      ktc_id: clean(r[iKtc]),
      merge_name: (r[iMerge] ?? r[iName] ?? "").trim(),
      position: r[iPos]?.trim() ?? "",
      team: r[iTeam]?.trim() ?? ""
    });
  }
  return out;
}

/** Map of Sleeper player_id → crosswalk entry. */
export async function getCrosswalk(): Promise<Map<string, CrosswalkEntry>> {
  const text = await cachedText(CROSSWALK_URL, DAY);
  const { header, rows } = parseCsv(text);
  const idx = (name: string) => header.indexOf(name);
  const iSleeper = idx("sleeper_id");
  const iGsis = idx("gsis_id");
  const iPfr = idx("pfr_id");
  const iKtc = idx("ktc_id");
  const iMerge = idx("merge_name");
  const iName = idx("name");
  const iPos = idx("position");
  const iTeam = idx("team");

  const map = new Map<string, CrosswalkEntry>();
  for (const r of rows) {
    const sleeper = r[iSleeper]?.trim();
    const gsis = r[iGsis]?.trim();
    if (!sleeper || sleeper === "NA" || !gsis || gsis === "NA") continue;
    map.set(sleeper, {
      sleeper_id: sleeper,
      gsis_id: gsis,
      pfr_id: r[iPfr] && r[iPfr] !== "NA" ? r[iPfr] : null,
      ktc_id: r[iKtc] && r[iKtc] !== "NA" ? r[iKtc] : null,
      merge_name: (r[iMerge] ?? r[iName] ?? "").trim(),
      position: r[iPos]?.trim() ?? "",
      team: r[iTeam]?.trim() ?? ""
    });
  }
  return map;
}

/* ----------------------------- stats ----------------------------- */

/** Map of gsis_id → advanced stat line for a single season. */
async function getSeasonStatsByGsis(
  season: string
): Promise<{ season: string; stats: Map<string, NflAdvancedStat> }> {
  // nflverse's newest complete season may lag the league's nominal season, so
  // try the requested season and step back up to 2 years on 404.
  const candidates = [season, String(Number(season) - 1), String(Number(season) - 2)];
  let text: string | null = null;
  let usedSeason = season;
  for (const s of candidates) {
    try {
      text = await cachedText(`${NFLVERSE_STATS_BASE}/stats_player_reg_${s}.csv`, DAY);
      usedSeason = s;
      break;
    } catch {
      // try previous season
    }
  }
  if (text == null) {
    return { season: usedSeason, stats: new Map() };
  }

  const { header, rows } = parseCsv(text);
  const idx = (name: string) => header.indexOf(name);
  const cols = {
    id: idx("player_id"),
    pos: idx("position"),
    team: idx("recent_team"),
    games: idx("games"),
    // passing
    att: idx("attempts"),
    passYds: idx("passing_yards"),
    passTds: idx("passing_tds"),
    ints: idx("passing_interceptions"),
    passEpa: idx("passing_epa"),
    cpoe: idx("passing_cpoe"),
    // rushing
    carries: idx("carries"),
    rushYds: idx("rushing_yards"),
    rushTds: idx("rushing_tds"),
    rushEpa: idx("rushing_epa"),
    // receiving
    rec: idx("receptions"),
    tgt: idx("targets"),
    recYds: idx("receiving_yards"),
    recTds: idx("receiving_tds"),
    tgtShare: idx("target_share"),
    ayShare: idx("air_yards_share"),
    wopr: idx("wopr"),
    racr: idx("racr"),
    recEpa: idx("receiving_epa"),
    // fantasy
    ppr: idx("fantasy_points_ppr")
  };

  const stats = new Map<string, NflAdvancedStat>();
  for (const r of rows) {
    const gsis = r[cols.id]?.trim();
    if (!gsis) continue;
    const games = num(r[cols.games]);
    const ppr = num(r[cols.ppr]);
    stats.set(gsis, {
      season: usedSeason,
      position: r[cols.pos]?.trim() ?? null,
      team: r[cols.team]?.trim() ?? null,
      games,
      ppr: round(ppr),
      ppg: ppr != null && games ? round(ppr / games) : null,
      // passing
      pass_attempts: num(r[cols.att]),
      passing_yards: num(r[cols.passYds]),
      passing_tds: num(r[cols.passTds]),
      interceptions: num(r[cols.ints]),
      passing_epa: round(num(r[cols.passEpa]), 1),
      passing_cpoe: round(num(r[cols.cpoe]), 1),
      // rushing
      carries: num(r[cols.carries]),
      rushing_yards: num(r[cols.rushYds]),
      rushing_tds: num(r[cols.rushTds]),
      rushing_epa: round(num(r[cols.rushEpa]), 1),
      // receiving
      receptions: num(r[cols.rec]),
      targets: num(r[cols.tgt]),
      receiving_yards: num(r[cols.recYds]),
      receiving_tds: num(r[cols.recTds]),
      target_share: round(num(r[cols.tgtShare]), 3),
      air_yards_share: round(num(r[cols.ayShare]), 3),
      wopr: round(num(r[cols.wopr]), 3),
      racr: round(num(r[cols.racr]), 3),
      receiving_epa: round(num(r[cols.recEpa]), 1)
    });
  }
  return { season: usedSeason, stats };
}

/* ---------------------------- combined --------------------------- */

export interface NflverseBundle {
  season: string;
  /** Sleeper player_id → advanced stat line. */
  bySleeper: Map<string, NflAdvancedStat>;
}

/**
 * Precomputed current-season stats, aggregated from nflverse play-by-play by
 * scripts/build-season-stats.mjs and committed to the repo. nflverse publishes
 * PBP months before the season aggregate, so this keeps us on the current
 * season instead of trailing a year — and adds red-zone opportunity, which
 * their aggregate doesn't carry at all.
 */
function loadPrecomputed(season: string): Map<string, NflAdvancedStat> | null {
  const file = PRECOMPUTED[season];
  if (!file) return null;
  const map = new Map<string, NflAdvancedStat>();
  for (const [gsis, raw] of Object.entries(file.players)) {
    const s = raw as Record<string, number | null>;
    map.set(gsis, {
      season,
      position: null,
      team: (raw.team as string | null) ?? null,
      games: s.games ?? null,
      ppr: null,
      ppg: null,
      pass_attempts: s.pass_attempts ?? null,
      passing_yards: s.passing_yards ?? null,
      passing_tds: s.passing_tds ?? null,
      interceptions: s.interceptions ?? null,
      passing_epa: s.passing_epa ?? null,
      passing_cpoe: s.passing_cpoe ?? null,
      carries: s.carries ?? null,
      rushing_yards: s.rushing_yards ?? null,
      rushing_tds: s.rushing_tds ?? null,
      rushing_epa: s.rushing_epa ?? null,
      receptions: s.receptions ?? null,
      targets: s.targets ?? null,
      receiving_yards: s.receiving_yards ?? null,
      receiving_tds: s.receiving_tds ?? null,
      target_share: s.target_share ?? null,
      air_yards_share: s.air_yards_share ?? null,
      wopr: s.wopr ?? null,
      racr: s.racr ?? null,
      receiving_epa: s.receiving_epa ?? null,
      carry_share: s.carry_share ?? null,
      rz_targets: s.rz_targets ?? null,
      rz_carries: s.rz_carries ?? null,
      rz_opportunities: s.rz_opportunities ?? null,
      i10_opportunities: s.i10_opportunities ?? null
    });
  }
  return map;
}

/**
 * Join crosswalk + season stats into a Sleeper-keyed advanced-stats map.
 *
 * Prefers the precomputed current-season file; falls back to nflverse's own
 * aggregate (which lags a season) only when no precomputed data exists.
 * Never throws — returns an empty map so callers degrade gracefully.
 */
export async function getNflAdvancedBySleeper(
  season = SEASON
): Promise<NflverseBundle> {
  try {
    const precomputed = loadPrecomputed(season);
    const [crosswalk, seasonStats] = await Promise.all([
      getCrosswalk(),
      precomputed ? Promise.resolve(null) : getSeasonStatsByGsis(season)
    ]);

    const byGsis = precomputed ?? seasonStats!.stats;
    const usedSeason = precomputed ? season : seasonStats!.season;

    const bySleeper = new Map<string, NflAdvancedStat>();
    for (const [sleeperId, entry] of crosswalk) {
      const stat = byGsis.get(entry.gsis_id);
      if (stat) bySleeper.set(sleeperId, stat);
    }
    return { season: usedSeason, bySleeper };
  } catch {
    return { season, bySleeper: new Map() };
  }
}
