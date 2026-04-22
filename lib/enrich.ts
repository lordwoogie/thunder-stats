import { EnrichedPlayer, SleeperPlayer, SleeperSeasonStats } from "./types";
import { PLAYER_NOTES, REF_STATS_BY_ID } from "./reference-stats";

const DEF_NAMES: Record<string, string> = {
  CLE: "Cleveland Browns",
  BUF: "Buffalo Bills",
  DAL: "Dallas Cowboys",
  KC: "Kansas City Chiefs",
  SF: "San Francisco 49ers",
  PHI: "Philadelphia Eagles",
  BAL: "Baltimore Ravens",
  MIN: "Minnesota Vikings",
  HOU: "Houston Texans"
};

export function enrichPlayer(
  playerId: string,
  playersMap: Record<string, SleeperPlayer>,
  stats: SleeperSeasonStats | null,
  gamesPlayed: number | null = null
): EnrichedPlayer {
  const sp = playersMap[playerId];
  const ref = REF_STATS_BY_ID[playerId];
  const note = PLAYER_NOTES[playerId] ?? ref?.note ?? null;

  // Defense records use team abbr as player_id
  if (!sp && playerId.length <= 3 && playerId === playerId.toUpperCase()) {
    return {
      player_id: playerId,
      name: DEF_NAMES[playerId] ?? `${playerId} DEF`,
      position: "DEF",
      team: playerId,
      age: null,
      injury_status: null,
      status: null,
      years_exp: null,
      search_rank: null,
      fpts_2025: null,
      ppg_2025: null,
      games_2025: null,
      note
    };
  }

  const statRow = stats?.[playerId];
  const fpts = statRow?.pts_ppr ?? ref?.fpts_2025 ?? null;
  const games = statRow?.gp ?? gamesPlayed ?? ref?.games_2025 ?? null;
  const ppg =
    fpts != null && games && games > 0
      ? Math.round((fpts / games) * 10) / 10
      : ref?.ppg_2025 ?? null;

  return {
    player_id: playerId,
    name:
      sp?.full_name ??
      ref?.name ??
      [sp?.first_name, sp?.last_name].filter(Boolean).join(" ") ??
      playerId,
    position: sp?.position ?? ref?.position ?? "—",
    team: sp?.team ?? ref?.team ?? "FA",
    age: sp?.age ?? ref?.age ?? null,
    injury_status: sp?.injury_status ?? null,
    status: sp?.status ?? null,
    years_exp: sp?.years_exp ?? null,
    search_rank: sp?.search_rank ?? null,
    fpts_2025: fpts != null ? Math.round(fpts * 10) / 10 : null,
    ppg_2025: ppg,
    games_2025: games,
    note
  };
}

export function sortByPPG(a: EnrichedPlayer, b: EnrichedPlayer): number {
  return (b.ppg_2025 ?? -1) - (a.ppg_2025 ?? -1);
}

export function avgAge(players: EnrichedPlayer[]): number {
  const ages = players.map((p) => p.age).filter((a): a is number => a != null);
  if (ages.length === 0) return 0;
  return Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10;
}
