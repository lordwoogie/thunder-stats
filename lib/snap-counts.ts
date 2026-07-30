/**
 * 2025 snap-share data from nflverse.
 *
 * nflverse publishes `snap_counts_2025.csv` (~2.2MB) even though the
 * aggregated `stats_player_reg_2025.csv` isn't out yet, so this is our
 * best current-season opportunity signal. Joined to Sleeper via the
 * `pfr_id` column in the DynastyProcess crosswalk.
 *
 *   Sleeper player_id -> (crosswalk) -> pfr_id -> snap counts
 */

import { getCrosswalkRaw, parseCsv, cachedText, DAY } from "./nflverse";

const SNAP_COUNTS_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_2025.csv";

export interface SnapShare {
  /** Mean offensive snap share across games played, 0–1. */
  snap_pct: number;
  /** Games with recorded offensive snaps. */
  games: number;
  /** Total offensive snaps. */
  snaps: number;
  team: string | null;
}

/** Map of Sleeper player_id → season snap share (regular season only). */
export async function getSnapSharesBySleeper(): Promise<Map<string, SnapShare>> {
  try {
    const [crosswalk, text] = await Promise.all([
      getCrosswalkRaw(),
      cachedText(SNAP_COUNTS_URL, DAY)
    ]);

    const { header, rows } = parseCsv(text);
    const idx = (n: string) => header.indexOf(n);
    const cType = idx("game_type");
    const cPfr = idx("pfr_player_id");
    const cPct = idx("offense_pct");
    const cSnaps = idx("offense_snaps");
    const cTeam = idx("team");

    // Aggregate weekly rows -> season averages, keyed by pfr_id.
    const byPfr = new Map<
      string,
      { sum: number; n: number; snaps: number; team: string | null }
    >();
    for (const r of rows) {
      if (r[cType] !== "REG") continue; // exclude playoffs
      const pfr = r[cPfr]?.trim();
      if (!pfr) continue;
      const pct = Number(r[cPct]);
      if (!Number.isFinite(pct)) continue;
      const snaps = Number(r[cSnaps]);
      const cur = byPfr.get(pfr) ?? { sum: 0, n: 0, snaps: 0, team: null };
      cur.sum += pct;
      cur.n += 1;
      cur.snaps += Number.isFinite(snaps) ? snaps : 0;
      cur.team = r[cTeam]?.trim() || cur.team;
      byPfr.set(pfr, cur);
    }

    // Re-key by Sleeper id.
    const out = new Map<string, SnapShare>();
    for (const entry of crosswalk) {
      if (!entry.pfr_id) continue;
      const agg = byPfr.get(entry.pfr_id);
      if (!agg || agg.n === 0) continue;
      out.set(entry.sleeper_id, {
        snap_pct: Math.round((agg.sum / agg.n) * 1000) / 1000,
        games: agg.n,
        snaps: agg.snaps,
        team: agg.team
      });
    }
    return out;
  } catch {
    return new Map();
  }
}
