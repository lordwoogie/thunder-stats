# The Octogon — working notes

Context that should survive between sessions. Read this first.

## The league

10-team **dynasty superflex, full PPR**, Sleeper league `1328541263934259200`.
Nick / LordWoogie is **roster_id 1**. Expanded from 8 teams in 2026.

Superflex is the dominant constraint: ~20 QBs start weekly against ~32
league-wide starters, so QBs are the scarcest asset and the strongest trade
currency. Standard-format instincts misprice them badly.

## Standing strategy

**Accumulate 2027 draft picks.** Nick believes that class is loaded and every
player is available for the right 2027 capital. The authoritative version of
this — plus team-by-team intel — lives in `lib/league-intel.ts`, which is
injected into every AI prompt. Update that file, not this one, when the
landscape changes.

Never treat two same-round picks as equivalent. A pick that originated with a
team that cannot reload is an early selection; a contender's is a late one.
Always say whose pick it is. BigDev0331 in particular has no 1st in 2027,
2028 or 2029 after going all-in on Bijan Robinson, which makes every BigDev
pick premium.

## Answering "is this trade good?"

This is the main thing Nick actually asks. What makes the answer good:

1. **Pull real numbers first.** Never analyze from memory. Two sources:
   - `data/2025-stats-brief.md` — 315 players, names, ready to read
   - `.cache/pbp_2025.csv` — full play-by-play if the brief lacks a field
     (~98MB, gitignored, re-fetch with `scripts/build-season-stats.mjs`)
2. **Lead with opportunity, not outcome.** Red-zone volume, target share and
   carry share predict next season far better than last season's touchdowns.
   The recurring finding is players whose TD count understates their usage.
3. **Check whether 2025 usage is still valid.** Offseason departures can
   invalidate a stat line entirely — a suppressed red-zone number often
   measures the guy ahead of him, not the player. See the Green Bay note in
   `lib/league-intel.ts` for the worked example.
4. **Price the picks separately from the players.** Several offers have looked
   fine on players while quietly costing a first.
5. **Say decline when it's decline.** Nick wants a verdict, not options.

## Environment constraint

`api.sleeper.app` is **blocked by this environment's egress policy** (403 on
CONNECT). Live rosters, trades and picks cannot be fetched from here — ask
Nick for a screenshot, or read it off the deployed app, which has normal
network access. Don't try to route around the policy.

FantasyPros and the Anthropic API are blocked from here too, so anything
touching those ships unverified against live responses.

## The app

Next.js 14 on Vercel, project `dynasty-hub`, live at
`dynasty-hub-three.vercel.app`. Pushes to `main` auto-deploy.

Gotcha worth remembering: the Vercel project was created when this repo held
only static HTML, so Framework Preset was `Other` and every build succeeded
while serving a platform 404. A green build never proved the app was served —
check **Function Invocations** in Observability instead.

## Conventions

- Work on `claude/sleeper-league-analyzer-o6Y6T`, PR into `main`, squash merge.
- Verify offline before shipping — synthetic fixtures for logic, known stat
  lines for data. Several bugs were caught this way that a build would not
  have surfaced.
- Say plainly what is unverified. Blocked APIs mean some paths ship untested,
  and that should be stated rather than glossed.
