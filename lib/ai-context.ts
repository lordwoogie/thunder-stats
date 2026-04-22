import { LEAGUE_FORMAT, MY_ROSTER_ID } from "./constants";
import { LeagueBundle } from "./league-service";
import { EnrichedPlayer, TeamOverview } from "./types";

function line(p: EnrichedPlayer): string {
  const parts = [
    p.name,
    `${p.position}/${p.team}`,
    p.age != null ? `age ${p.age}` : null,
    p.ppg_2025 != null ? `${p.ppg_2025} PPG` : null,
    p.fpts_2025 != null ? `${p.fpts_2025} FPTS` : null,
    p.games_2025 != null ? `${p.games_2025}G` : null,
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

  return lines.join("\n");
}

export const SYSTEM_PROMPT = `You are a senior dynasty fantasy football analyst embedded as an in-app assistant.

Priorities when answering:
- Think like a dynasty GM: balance win-now vs. future, age curves, draft capital.
- Use the league context (format, scoring, roster structure) on every answer.
- When evaluating players, weight 2025 PPG over raw totals, and call out injuries,
  depth-chart risk, and TD regression candidates.
- Be concrete: name specific players and picks. Avoid generic advice.
- If you suggest a drop, list the players in order of drop priority with one-line reasoning.
- If you suggest a trade, specify both sides and why each party benefits.
- Keep responses tight. Bulleted lists beat prose.
- This is a Superflex league, so two-QB value matters a lot. A 2nd QB with a starting job > a WR3/RB3.
- Respect the user: you are advising LordWoogie (roster_id 1). Speak in second person to them.
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
      "Rank all 8 teams 1–8 for 2026 dynasty strength, with a one-line rationale per team. Then separately rank them for the 2026 regular season (win-now only)."
  },
  rookie_draft: {
    title: "Rookie Draft Strategy",
    prompt:
      "Based on my roster construction, what positions should I target in the 2026 rookie draft? What is my biggest positional need for year-1 impact, and what is my biggest long-term hole? Assume I have a top-4 rookie pick."
  },
  vor: {
    title: "Value Over Replacement",
    prompt:
      "Identify the 3 players on my roster with the highest and the 3 with the lowest VOR at their position for 2026. Compare their 2025 PPG to replacement-level starters in this 8-team Superflex format."
  }
};
