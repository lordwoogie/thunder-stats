/**
 * Derived 2025 usage metrics.
 *
 * nflverse hasn't published aggregated 2025 player stats yet, so we compute
 * the opportunity metrics that matter ourselves from Sleeper's own season
 * stats endpoint: team target/carry totals give us target share, carry share
 * and touch share without any new data source.
 *
 * Combined with nflverse snap share (lib/snap-counts.ts), this covers the
 * bulk of what dynasty decisions actually hinge on for the current season.
 */

import { SleeperPlayer, SleeperSeasonStats } from "./types";

/** Sleeper stat keys vary slightly by era; try each candidate in order. */
function stat(
  row: Record<string, number> | undefined,
  ...keys: string[]
): number | null {
  if (!row) return null;
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

const K = {
  games: ["gp", "gms_active"],
  passAtt: ["pass_att"],
  passCmp: ["pass_cmp", "cmp"],
  passYd: ["pass_yd"],
  passTd: ["pass_td"],
  passInt: ["pass_int", "int"],
  rushAtt: ["rush_att"],
  rushYd: ["rush_yd"],
  rushTd: ["rush_td"],
  targets: ["rec_tgt", "tgt"],
  rec: ["rec"],
  recYd: ["rec_yd"],
  recTd: ["rec_td"],
  ppr: ["pts_ppr"]
} as const;

export interface SeasonUsage {
  season: string;
  position: string | null;
  team: string | null;
  games: number | null;
  ppr: number | null;
  ppg: number | null;

  // raw volume
  pass_attempts: number | null;
  completions: number | null;
  passing_yards: number | null;
  passing_tds: number | null;
  interceptions: number | null;
  carries: number | null;
  rushing_yards: number | null;
  rushing_tds: number | null;
  targets: number | null;
  receptions: number | null;
  receiving_yards: number | null;
  receiving_tds: number | null;

  // efficiency
  completion_pct: number | null;
  yards_per_attempt: number | null;
  yards_per_carry: number | null;
  yards_per_target: number | null;
  catch_rate: number | null;

  // opportunity shares (0–1, share of that player's team total)
  target_share: number | null;
  carry_share: number | null;
  /** (carries + targets) as a share of team carries + targets */
  touch_share: number | null;
  /** mean offensive snap share from nflverse, 0–1 */
  snap_share: number | null;

  // per-game rates
  touches_per_game: number | null;
  targets_per_game: number | null;
  carries_per_game: number | null;
  pass_attempts_per_game: number | null;
  rush_yards_per_game: number | null;
}

function ratio(a: number | null, b: number | null, dp = 3): number | null {
  if (a == null || b == null || b === 0) return null;
  const f = 10 ** dp;
  return Math.round((a / b) * f) / f;
}

function perGame(v: number | null, g: number | null): number | null {
  if (v == null || !g || g <= 0) return null;
  return Math.round((v / g) * 10) / 10;
}

/**
 * Build per-player 2025 usage, including team-relative opportunity shares.
 *
 * @param stats    Sleeper season stats keyed by player_id
 * @param players  Sleeper /players/nfl map (supplies team + position)
 * @param snaps    optional Sleeper-keyed snap shares from nflverse
 */
export function buildSeasonUsage(
  season: string,
  stats: SleeperSeasonStats | null,
  players: Record<string, SleeperPlayer>,
  snaps: Map<string, { snap_pct: number }> | null = null
): Map<string, SeasonUsage> {
  const out = new Map<string, SeasonUsage>();
  if (!stats) return out;

  // Pass 1 — team totals for share denominators.
  const teamTotals = new Map<
    string,
    { targets: number; carries: number }
  >();
  for (const [pid, row] of Object.entries(stats)) {
    const team = players[pid]?.team;
    if (!team) continue;
    const t = teamTotals.get(team) ?? { targets: 0, carries: 0 };
    t.targets += stat(row, ...K.targets) ?? 0;
    t.carries += stat(row, ...K.rushAtt) ?? 0;
    teamTotals.set(team, t);
  }

  // Pass 2 — per-player metrics.
  for (const [pid, row] of Object.entries(stats)) {
    const sp = players[pid];
    const team = sp?.team ?? null;
    const totals = team ? teamTotals.get(team) : undefined;

    const games = stat(row, ...K.games);
    const ppr = stat(row, ...K.ppr);
    const passAtt = stat(row, ...K.passAtt);
    const cmp = stat(row, ...K.passCmp);
    const passYd = stat(row, ...K.passYd);
    const carries = stat(row, ...K.rushAtt);
    const rushYd = stat(row, ...K.rushYd);
    const targets = stat(row, ...K.targets);
    const rec = stat(row, ...K.rec);
    const recYd = stat(row, ...K.recYd);

    const touches =
      carries != null || targets != null
        ? (carries ?? 0) + (targets ?? 0)
        : null;
    const teamTouches = totals ? totals.carries + totals.targets : null;

    out.set(pid, {
      season,
      position: sp?.position ?? null,
      team,
      games,
      ppr: ppr != null ? Math.round(ppr * 10) / 10 : null,
      ppg: ppr != null && games ? Math.round((ppr / games) * 10) / 10 : null,

      pass_attempts: passAtt,
      completions: cmp,
      passing_yards: passYd,
      passing_tds: stat(row, ...K.passTd),
      interceptions: stat(row, ...K.passInt),
      carries,
      rushing_yards: rushYd,
      rushing_tds: stat(row, ...K.rushTd),
      targets,
      receptions: rec,
      receiving_yards: recYd,
      receiving_tds: stat(row, ...K.recTd),

      completion_pct: ratio(cmp, passAtt, 3),
      yards_per_attempt: ratio(passYd, passAtt, 1),
      yards_per_carry: ratio(rushYd, carries, 1),
      yards_per_target: ratio(recYd, targets, 1),
      catch_rate: ratio(rec, targets, 3),

      target_share: ratio(targets, totals?.targets ?? null, 3),
      carry_share: ratio(carries, totals?.carries ?? null, 3),
      touch_share: ratio(touches, teamTouches, 3),
      snap_share: snaps?.get(pid)?.snap_pct ?? null,

      touches_per_game: perGame(touches, games),
      targets_per_game: perGame(targets, games),
      carries_per_game: perGame(carries, games),
      pass_attempts_per_game: perGame(passAtt, games),
      rush_yards_per_game: perGame(rushYd, games)
    });
  }

  return out;
}
