/**
 * Draft pick inventory.
 *
 * Sleeper's /traded_picks endpoint reports only the picks that have moved.
 * Everything else is implied: every roster starts owning its own pick in
 * every round of every future draft, and a trade rewrites one of those
 * ownerships. So the inventory is built by generating the full grid and then
 * applying the deltas on top.
 *
 * Rookie drafts are the currency in this league, so the label distinguishes a
 * roster's own pick from one it acquired — "2027 1st" versus
 * "2027 1st (via Miguelboys)". Two 2027 1sts are not the same asset, and a
 * trade UI that shows them identically invites the wrong click.
 */

import { DraftPick, SleeperLeague, SleeperTradedPick } from "./types";

/** How many future drafts to enumerate, counting the upcoming one. */
const FUTURE_DRAFTS = 3;

function ordinal(round: number): string {
  if (round === 1) return "1st";
  if (round === 2) return "2nd";
  if (round === 3) return "3rd";
  return `${round}th`;
}

/**
 * Rounds in this league's rookie draft. Sleeper stores it on league settings;
 * fall back to 4, which is this league's configured depth.
 */
function draftRounds(league: SleeperLeague | null): number {
  const n = league?.settings?.draft_rounds;
  return typeof n === "number" && n > 0 && n <= 10 ? n : 4;
}

/**
 * Build every roster's current pick holdings.
 *
 * @param rosterIds  every roster in the league
 * @param traded     deltas from getTradedPicks()
 * @param league     supplies round count and the season to start from
 * @param nameFor    resolves a roster_id to a display name for "via" labels
 */
export function buildPickInventory(
  rosterIds: number[],
  traded: SleeperTradedPick[],
  league: SleeperLeague | null,
  nameFor: (rosterId: number) => string
): Map<number, DraftPick[]> {
  const rounds = draftRounds(league);
  // Sleeper's league.season is the season currently in progress; the next
  // rookie draft belongs to that same season until the league rolls over.
  const startYear = Number(league?.season) || new Date().getFullYear();

  // owner keyed by "season-round-originRoster"
  const owner = new Map<string, number>();
  const seasons: string[] = [];
  for (let i = 0; i < FUTURE_DRAFTS; i++) {
    seasons.push(String(startYear + i));
  }

  for (const season of seasons) {
    for (let round = 1; round <= rounds; round++) {
      for (const rid of rosterIds) {
        owner.set(`${season}-${round}-${rid}`, rid);
      }
    }
  }

  // Apply trades. Ignore anything outside the window we generated — Sleeper
  // keeps historical rows for drafts that have already happened.
  for (const t of traded) {
    const key = `${t.season}-${t.round}-${t.roster_id}`;
    if (owner.has(key)) owner.set(key, t.owner_id);
  }

  const out = new Map<number, DraftPick[]>();
  for (const rid of rosterIds) out.set(rid, []);

  for (const [key, ownerId] of owner) {
    const [season, roundStr, originStr] = key.split("-");
    const round = Number(roundStr);
    const origin = Number(originStr);
    const acquired = origin !== ownerId;
    const bucket = out.get(ownerId);
    if (!bucket) continue; // pick held by a roster no longer in the league
    bucket.push({
      id: key,
      season,
      round,
      origin_roster_id: origin,
      owner_roster_id: ownerId,
      acquired,
      label: acquired
        ? `${season} ${ordinal(round)} (via ${nameFor(origin)})`
        : `${season} ${ordinal(round)}`
    });
  }

  for (const picks of out.values()) {
    picks.sort(
      (a, b) =>
        a.season.localeCompare(b.season) ||
        a.round - b.round ||
        a.origin_roster_id - b.origin_roster_id
    );
  }

  return out;
}
