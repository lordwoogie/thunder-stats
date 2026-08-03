import { LEAGUE_FORMAT, MY_ROSTER_ID, SEASON } from "./constants";
import { describeDepth } from "./depth-charts";
import { LEAGUE_INTEL } from "./league-intel";
import { LeagueBundle } from "./league-service";
import { EnrichedPlayer, TeamOverview } from "./types";

const pctStr = (v: number | null | undefined) =>
  v != null ? `${Math.round(v * 1000) / 10}%` : null;

/**
 * Current-season (2025) usage, tailored per position — the numbers that
 * actually drive decisions differ sharply between QB, RB and pass catchers.
 */
function usageBits(p: EnrichedPlayer): string[] {
  const u = p.usage;
  if (!u) return [];
  const bits: string[] = [];
  const pos = (u.position ?? p.position ?? "").toUpperCase();

  if (pos === "QB") {
    if (u.pass_attempts) bits.push(`${u.pass_attempts} att`);
    if (u.pass_attempts_per_game) bits.push(`${u.pass_attempts_per_game} att/g`);
    const cp = pctStr(u.completion_pct);
    if (cp) bits.push(`comp ${cp}`);
    if (u.yards_per_attempt) bits.push(`${u.yards_per_attempt} Y/A`);
    if (u.passing_tds != null) bits.push(`${u.passing_tds} pass TD`);
    if (u.interceptions != null) bits.push(`${u.interceptions} INT`);
    // rushing production is the single biggest QB differentiator in superflex
    if (u.carries) bits.push(`${u.carries} rush att`);
    if (u.rushing_yards) bits.push(`${u.rushing_yards} rush yd`);
    if (u.rushing_tds) bits.push(`${u.rushing_tds} rush TD`);
    if (u.rush_yards_per_game) bits.push(`${u.rush_yards_per_game} rush yd/g`);
  } else if (pos === "RB") {
    if (u.carries) bits.push(`${u.carries} carries`);
    const cs = pctStr(u.carry_share);
    if (cs) bits.push(`carry share ${cs}`);
    if (u.yards_per_carry) bits.push(`${u.yards_per_carry} YPC`);
    if (u.targets) bits.push(`${u.targets} tgt`);
    if (u.receptions) bits.push(`${u.receptions} rec`);
    const ts = pctStr(u.touch_share);
    if (ts) bits.push(`touch share ${ts}`);
    if (u.touches_per_game) bits.push(`${u.touches_per_game} touch/g`);
    const ss = pctStr(u.snap_share);
    if (ss) bits.push(`snap ${ss}`);
  } else {
    // WR / TE
    if (u.targets) bits.push(`${u.targets} tgt`);
    const ts = pctStr(u.target_share);
    if (ts) bits.push(`tgt share ${ts}`);
    if (u.targets_per_game) bits.push(`${u.targets_per_game} tgt/g`);
    const cr = pctStr(u.catch_rate);
    if (cr) bits.push(`catch ${cr}`);
    if (u.yards_per_target) bits.push(`${u.yards_per_target} Y/tgt`);
    const ss = pctStr(u.snap_share);
    if (ss) bits.push(`snap ${ss}`);
  }
  return bits;
}

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
    if (a.rz_targets != null) bits.push(`${a.rz_targets} RZ tgt`);
  }
  if (a.carries != null && a.carries > 0) {
    bits.push(`${a.carries} carries`);
    if (a.rushing_epa != null) bits.push(`rush EPA ${a.rushing_epa}`);
    if (a.rz_carries != null) bits.push(`${a.rz_carries} RZ car`);
  }
  if (a.pass_attempts != null && a.pass_attempts > 0) {
    bits.push(`${a.pass_attempts} att`);
    if (a.passing_epa != null) bits.push(`pass EPA ${a.passing_epa}`);
    if (a.passing_cpoe != null) bits.push(`CPOE ${a.passing_cpoe}`);
  }
  if (a.i10_opportunities != null) bits.push(`${a.i10_opportunities} inside-10`);
  return bits;
}

/** Market consensus + forward projection from FantasyPros. */
function marketBits(p: EnrichedPlayer): string[] {
  const bits: string[] = [];
  if (p.rank) {
    const r = [
      p.rank.ecr != null ? `ECR #${p.rank.ecr}` : null,
      p.rank.pos_rank ? p.rank.pos_rank : null,
      p.rank.tier != null ? `tier ${p.rank.tier}` : null,
      p.rank.delta != null && p.rank.delta !== 0
        ? `${p.rank.delta < 0 ? "rising" : "falling"} ${Math.abs(p.rank.delta)}`
        : null
    ].filter(Boolean);
    if (r.length) bits.push(`DYN ${r.join("/")}`);
  }
  if (p.projection?.points_ppr != null) {
    bits.push(`proj ${p.projection.points_ppr} PPR`);
  }
  return bits;
}

function line(p: EnrichedPlayer): string {
  const parts = [
    p.name,
    `${p.position}/${p.team}`,
    p.age != null ? `age ${p.age}` : null,
    // Rookie vs. failed-prospect is invisible from age alone — a 23-year-old
    // in year 1 and a 23-year-old in year 3 are opposite stash cases.
    p.years_exp != null
      ? p.years_exp === 0
        ? "ROOKIE"
        : `yr${p.years_exp + 1}`
      : null,
    p.ppg_2025 != null ? `${p.ppg_2025} PPG` : null,
    p.fpts_2025 != null ? `${p.fpts_2025} FPTS` : null,
    p.games_2025 != null ? `${p.games_2025}G` : null,
    ...usageBits(p),
    ...marketBits(p),
    describeDepth(p.depth),
    p.injury_status ? `inj:${p.injury_status}` : null,
    p.note ? `(${p.note})` : null
  ].filter(Boolean);

  // Prior-season advanced metrics are a different year — label them so the
  // model never blends them with current-season usage above.
  const adv = advancedBits(p);
  const advStr =
    adv.length > 0 && p.advanced
      ? ` [${p.advanced.season}: ${adv.join(", ")}]`
      : "";

  return `  - ${parts.join(", ")}${advStr}`;
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
  lines.push(
    `Player lines carry ${SEASON} usage metrics, position-specific. Glossary:`
  );
  lines.push(
    `- QB: att/g (volume), comp % , Y/A (efficiency), and rushing volume — rushing production is the biggest QB separator in Superflex, weight it heavily.`
  );
  lines.push(
    `- RB: carry share (% of team carries; >55% = true bellcow, 35-55% = committee lead, <25% = backup), touch share, touch/g, and snap % (<40% = rotational, >65% = every-down). A pass-catching RB with low carry share can still be a PPR RB1.`
  );
  lines.push(
    `- WR/TE: tgt share (>25% = alpha, 20-25% = strong WR1/2, <15% = volatile), tgt/g, catch %, Y/tgt, snap %.`
  );
  lines.push(
    `Shares are computed vs. that player's own team totals. Snap % is nflverse ${SEASON} regular season.`
  );
  lines.push(
    `- DYN: FantasyPros dynasty SUPERFLEX consensus (position=OP, PPR) for this league's exact format. ECR is overall expert consensus rank; tier groups roughly interchangeable players; rising/falling is recent movement. This is live market value — use it as the price, and your own read of usage/red-zone as the value. Gaps between the two are the trade edge.`
  );
  lines.push(
    `- proj: FantasyPros projected full-PPR points for the UPCOMING season. Forward-looking, unlike everything else here. When projection and ${SEASON} red-zone volume disagree, say so explicitly — that is usually where mispricing lives.`
  );
  lines.push(
    `- Depth: current NFL depth-chart standing, e.g. "RB2 behind Bijan Robinson (3 deep)". This is live offseason data and reflects 2026 roster moves, so it can contradict ${SEASON} usage — when it does, the depth chart is the forward-looking signal and usage is the backward-looking one. A buried player with strong prior usage is a change-of-situation candidate, not a hold.`
  );

  if (bundle.advancedSeason) {
    lines.push("");
    lines.push(
      bundle.advancedSeason === SEASON
        ? `Bracketed [${bundle.advancedSeason}: ...] segments are advanced metrics for the SAME ${SEASON} season, aggregated from nflverse play-by-play. Same year as the figures above — read them together. Glossary:`
        : `Bracketed [${bundle.advancedSeason}: ...] segments are PRIOR-season advanced metrics — a different year from the ${SEASON} figures above. Do not blend the two; use them for trajectory (improving vs. declining). Glossary:`
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
      `- RZ tgt / RZ car: targets or carries inside the 20. Inside-10: touches inside the 10 — the goal-line role.`
    );
    lines.push(
      `TD REGRESSION IS THE KEY READ: red-zone volume predicts future TDs far better than past TDs do. A player with heavy RZ and inside-10 volume but few actual TDs is a strong BUY — the scores are coming. The reverse (few RZ looks, many TDs) is a SELL. Always cite the RZ numbers when arguing either case.`
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

## SUPERFLEX IS THE DOMINANT FORMAT CONSTRAINT

This is a 10-team SUPERFLEX league. Roughly 20 QBs start every week across
only 10 rosters, against a league-wide supply of ~32 starters. QB is by far
the scarcest resource, and standard-format instincts will misprice it badly.

- Any QB with a starting job outranks almost any WR3/RB3. Treat a startable
  QB as a top-24 overall asset even when his raw PPG looks mediocre —
  positional scarcity, not points, sets his price.
- A young QB with a credible path to starting is a premium hold, not a
  bench-clogger. Never list one as a drop candidate ahead of a skill player
  unless he is genuinely out of the league.
- Only recommend cutting a QB when he is unrostered by an NFL team, retired,
  or age 35+ with no starting path. State which of those applies.
- When comparing trade sides, price QBs above their standard-format value and
  say so explicitly. A 1-for-1 that sends a QB out is usually a loss.

## DYNASTY: STASHING IS A REAL STRATEGY, NOT A TIEBREAKER

This is dynasty with taxi and IR slots. Bench spots are cheap; young talent
that hits is not. The payoff is asymmetric — cutting a 22-year-old who breaks
out costs far more than the roster spot ever saved.

- Sort drop candidates into two explicit buckets: CUT (age curve finished, no
  NFL path, replaceable off waivers) and STASH (young, unproven, cheap option
  value). Never collapse them into one ranked list.
- Never justify dropping a rookie or second-year player on current usage
  alone. Low snaps in year 1 is the default, not a signal. Ask instead
  whether the path exists in 2027-28.
- Age and experience are in every player line ("age 22, ROOKIE", "age 27,
  yr5"). Use them. A buried 22-year-old and a buried 27-year-old are opposite
  recommendations even with identical stat lines.
- Prefer cutting a productive-but-old player over an unproductive young one
  when the roster crunch is real. Say when you are making that trade-off.
- Taxi slots exist for exactly this. If a young player is taxi-eligible,
  suggest taxi over cut.

## GENERAL

- Think like a dynasty GM: balance win-now vs. future, age curves, draft capital.
- Use the league context (format, scoring, roster structure) on every answer.
- When evaluating players, weight PPG over raw totals, and call out injuries,
  depth-chart risk, and TD regression candidates.
- When advanced metrics (target share, WOPR, air-yards share, EPA, CPOE) are
  present, lead with opportunity over box-score outcome. Cite the specific
  number when it drives your conclusion — "25% target share" beats "high volume".
- Be concrete: name specific players and picks. Avoid generic advice.
- If you suggest a trade, specify both sides and why each party benefits.
- Keep responses tight. Bulleted lists beat prose.
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
      "I need to open bench spots for rookie draft picks and waiver claims. Split my roster into two buckets: (1) CUT — age curve done, no NFL path, replaceable off waivers; (2) STASH — young or unproven with real option value I should keep or move to taxi even though they contribute nothing now. Rank within each bucket with a one-line reason. For every STASH, say what 2027-28 outcome would justify the spot. Remember this is Superflex — do not rank a QB with a starting job as a cut."
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
  qb_room: {
    title: "QB Room (Superflex)",
    prompt:
      "Analyze my QB room for a Superflex league. For each QB: attempts/game, completion %, Y/A, and especially rushing volume. Who is my locked-in QB1 and QB2 for 2026, who is expendable, and am I one injury away from a hole? Given Superflex scarcity, should I be acquiring another starting-caliber QB, and who in the league is gettable?"
  },
  rb_room: {
    title: "RB Room (Workload)",
    prompt:
      "Analyze my RB room by workload, not name value. For each RB give carry share, touch share, touches/game and snap share, then classify each as bellcow / committee lead / passing-down back / handcuff / roster clog. Which of my RBs have a workload that justifies a starting lineup spot in 2026, which are trade chips whose name value exceeds their role, and which are cuts?"
  },
  depth_risk: {
    title: "Depth Chart Risk",
    prompt:
      "Go through my roster by current NFL depth-chart standing. Flag: (1) players buried behind someone who make my roster for name value only, (2) players whose depth chart improved via 2026 roster moves and are now undervalued holds, (3) any of my starters with a credible threat right behind them. Name the specific player ahead of or behind each one."
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
