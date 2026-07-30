import { LEAGUE_FORMAT, MY_ROSTER_ID } from "./constants";
import { LEAGUE_INTEL } from "./league-intel";
import { LeagueBundle } from "./league-service";
import { EnrichedPlayer, TeamOverview } from "./types";

/** Advanced-metric suffix: opportunity + efficiency signals from nflverse. */
function advancedBits(p: EnrichedPlayer): string[] {
  const a = p.advanced;
  if (!a) return [];
  const bits: string[] = [];
  const pct = (v: number | null) =>
    v != null ? `${Math.round(v * 1000) / 10}%` : null;

  if (a.targets != null && a.targets > 0) {
    bits.push(`${a.targets} tgt`);
    const ts = pct(a.target_share);
    if (ts) bits.push(`tgt share ${ts}`);
    const ays = pct(a.air_yards_share);
    if (ays) bits.push(`AY share ${ays}`);
    if (a.wopr != null) bits.push(`WOPR ${a.wopr}`);
    if (a.racr != null) bits.push(`RACR ${a.racr}`);
    if (a.receiving_epa != null) bits.push(`rec EPA ${a.receiving_epa}`);
  }
  if (a.carries != null && a.carries > 0) {
    bits.push(`${a.carries} carries`);
    if (a.rushing_epa != null) bits.push(`rush EPA ${a.rushing_epa}`);
  }
  if (a.pass_attempts != null && a.pass_attempts > 0) {
    bits.push(`${a.pass_attempts} att`);
    if (a.passing_epa != null) bits.push(`pass EPA ${a.passing_epa}`);
    if (a.passing_cpoe != null) bits.push(`CPOE ${a.passing_cpoe}`);
  }
  return bits;
}

function line(p: EnrichedPlayer): string {
  const parts = [
    p.name,
    `${p.position}/${p.team}`,
    p.age != null ? `age ${p.age}` : null,
    p.ppg_2025 != null ? `${p.ppg_2025} PPG` : null,
    p.fpts_2025 != null ? `${p.fpts_2025} FPTS` : null,
    p.games_2025 != null ? `${p.games_2025}G` : null,
    ...advancedBits(p),
    p.injury_status ? `inj:${p.injury_status}` : null,
    p.note ? `(${p.note})` : null
  ].filter(Boolean);
  return `  - ${parts.join(", ")}`;
}

function teamSection(team: TeamOverview, isMe: boolean): string {
  const header = isMe
    ? `### ${team.team_name} (${team.display_name}) — MY TEAM, roster_id=${team.roster_id}`
    : `### ${team.team_name} (${team.display_name}) — roster_id=${team.roster_id}`;

  const body: string[] = [header];
  body.push(
    `Record ${team.record.wins}-${team.record.losses}-${team.record.ties} | 2025 FPTS sum ${team.total_fpts_2025} | Avg age ${team.avg_age}`
  );

  body.push("Starters:");
  team.starters.forEach((p) => body.push(line(p)));

  if (team.bench.length > 0) {
    body.push("Bench:");
    team.bench.forEach((p) => body.push(line(p)));
  }
  if (team.taxi.length > 0) {
    body.push("Taxi:");
    team.taxi.forEach((p) => body.push(line(p)));
  }
  if (team.reserve.length > 0) {
    body.push("IR/Reserve:");
    team.reserve.forEach((p) => body.push(line(p)));
  }
  return body.join("\n");
}

export function buildLeagueContext(bundle: LeagueBundle): string {
  const { league, teams } = bundle;
  const me = teams.find((t) => t.roster_id === MY_ROSTER_ID);

  const lines: string[] = [];
  lines.push(`League: ${league.name} (id ${league.league_id})`);
  lines.push(
    `Format: ${LEAGUE_FORMAT.size}-team ${LEAGUE_FORMAT.format}, ${LEAGUE_FORMAT.scoring}, ${LEAGUE_FORMAT.taxi_slots} taxi, ${LEAGUE_FORMAT.ir_slots} IR, ${LEAGUE_FORMAT.max_keepers} keepers. Season ${league.season}, status ${league.status}.`
  );
  lines.push(
    `Scoring highlights: 1pt/rec, 0.04/pass yd, 0.1/rush or rec yd, 4pt pass TD, 6pt rush/rec TD, -1 INT, -2 fumble lost.`
  );

  if (bundle.advancedSeason) {
    lines.push("");
    lines.push(
      `Advanced metrics below are ${bundle.advancedSeason} regular-season data from nflverse. Glossary:`
    );
    lines.push(
      `- tgt share: % of team targets. >25% = alpha, 20-25% = strong WR1/2, <15% = volatile.`
    );
    lines.push(
      `- AY share: % of team air yards — measures downfield role and TD equity.`
    );
    lines.push(
      `- WOPR: weighted opportunity rating (1.5*tgt share + 0.7*AY share). >0.7 elite, 0.5-0.7 strong, <0.4 thin.`
    );
    lines.push(
      `- RACR: receiving yards per air yard — efficiency converting targets to yardage.`
    );
    lines.push(
      `- EPA: expected points added (cumulative). Positive = added value over average.`
    );
    lines.push(
      `- CPOE: completion % over expected for QBs. Positive = accurate beyond difficulty.`
    );
    lines.push(
      `Use these to separate OPPORTUNITY from OUTCOME: a player with elite target share but weak PPG is a buy-low (production will follow volume); high PPG on low target share is a sell-high (TD-driven, unsustainable).`
    );
  }
  lines.push("");

  if (me) {
    lines.push("## My Team");
    lines.push(teamSection(me, true));
    lines.push("");
  }

  lines.push("## All League Rosters");
  teams.forEach((t) => {
    if (t.roster_id === MY_ROSTER_ID) return;
    lines.push(teamSection(t, false));
    lines.push("");
  });

  lines.push(LEAGUE_INTEL);

  return lines.join("\n");
}

export const SYSTEM_PROMPT = `You are a senior dynasty fantasy football analyst embedded as an in-app assistant.

Priorities when answering:
- Think like a dynasty GM: balance win-now vs. future, age curves, draft capital.
- Use the league context (format, scoring, roster structure) on every answer.
- When evaluating players, weight PPG over raw totals, and call out injuries,
  depth-chart risk, and TD regression candidates.
- When advanced metrics (target share, WOPR, air-yards share, EPA, CPOE) are
  present, lead with opportunity over box-score outcome. Cite the specific
  number when it drives your conclusion — "25% target share" beats "high volume".
- Be concrete: name specific players and picks. Avoid generic advice.
- If you suggest a drop, list the players in order of drop priority with one-line reasoning.
- If you suggest a trade, specify both sides and why each party benefits.
- Keep responses tight. Bulleted lists beat prose.
- This is a Superflex league, so two-QB value matters a lot. A 2nd QB with a starting job > a WR3/RB3.
- Respect the user: you are advising LordWoogie (roster_id 1). Speak in second person to them.
- Honor the "League Landscape" intel section: respect the active game plan,
  avoid re-litigating decisions already made, and factor in which owners are
  good/bad trade partners when suggesting deals.
`;

export const PREBUILT_PROMPTS: Record<
  string,
  { title: string; prompt: string }
> = {
  strengths: {
    title: "Roster Strengths & Weaknesses",
    prompt:
      "Evaluate my roster position-by-position. For each of QB, RB, WR, TE, give: (1) grade A–F for win-now 2026, (2) grade for 3-year dynasty outlook, (3) one-line why. Then summarize 2 biggest strengths and 2 biggest weaknesses across the roster."
  },
  drops: {
    title: "Drop Candidates",
    prompt:
      "Which players on my roster are the clearest drop candidates if I need to open a bench spot for rookie draft picks or waiver claims? List in ranked order with a one-line reason each. Explicitly consider age, team situation, depth chart, and opportunity cost."
  },
  buy_sell: {
    title: "Buy Low / Sell High Targets",
    prompt:
      "Given my roster and the league, who across the league should I target as buy-lows, and who on my own roster should I consider selling high? Name specific players, why, and ballpark trade framework."
  },
  power: {
    title: "League Power Rankings",
    prompt:
      "Rank all 10 teams 1–10 for 2026 dynasty strength, with a one-line rationale per team. Then separately rank them for the 2026 regular season (win-now only)."
  },
  rookie_draft: {
    title: "Rookie Draft Strategy",
    prompt:
      "Based on my roster construction, what positions should I target in the 2026 rookie draft? What is my biggest positional need for year-1 impact, and what is my biggest long-term hole? I hold pick 1.05 — evaluate my rookie board and whether best-RB-available is right there."
  },
  opportunity: {
    title: "Opportunity vs. Production",
    prompt:
      "Using target share, air-yards share, WOPR and EPA, find the players on my roster whose OPPORTUNITY outstrips their fantasy production (buy-low / breakout candidates I should hold or acquire more of), and the ones whose production outstrips their opportunity (sell-high, TD-regression risks). Cite the specific metrics."
  },
  league_buys: {
    title: "League-Wide Buy Lows",
    prompt:
      "Scan every other roster in the league for players with elite opportunity metrics (high target share, WOPR, or EPA) but mediocre fantasy points — the guys their managers may undervalue. Rank the top 5 acquisition targets, note which roster holds each, and suggest an opening offer for each using my tradeable depth."
  },
  vor: {
    title: "Value Over Replacement",
    prompt:
      "Identify the 3 players on my roster with the highest and the 3 with the lowest VOR at their position for 2026. Compare their 2025 PPG to replacement-level starters in this 10-team Superflex format."
  }
};
