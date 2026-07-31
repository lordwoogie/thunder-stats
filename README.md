# The Octogon — Sleeper Dynasty Analyzer

Next.js app for Nick's Sleeper dynasty league **The Octogon** (10-team Superflex,
Full PPR — expanded from 8 in 2026). Pulls live rosters from the Sleeper API, enriches them with 2025
season stats, and uses Claude (Anthropic) for on-demand analysis.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Anthropic SDK (Claude Sonnet 5 by default, override with `ANTHROPIC_MODEL`)
- Sleeper public API (no auth required)

## Setup

```bash
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

| Route      | What it does                                                      |
|------------|-------------------------------------------------------------------|
| `/`        | Dashboard: my starters, bench (sorted by PPG), taxi, IR           |
| `/stats`   | Full roster sorted by 2025 PPG with status + notes                |
| `/ai`      | AI Analysis: pre-built prompts + free-form "Ask Anything"         |
| `/league`  | All teams at a glance with key starters and totals                |
| `/trade`   | Trade Analyzer: propose a deal, Claude returns a dynasty verdict  |

## API routes

| Route                 | Purpose                                           |
|-----------------------|---------------------------------------------------|
| `GET /api/league`     | Full league bundle (rosters + users + stats)      |
| `GET /api/trending`   | Sleeper trending adds/drops (`?type=add\|drop`)   |
| `POST /api/ai/analyze`| `{ prompt, title? }` → Claude response            |
| `POST /api/ai/trade`  | `{ my_side, their_side, their_team?, notes? }`    |

## Caching

In-process memory cache (`lib/sleeper.ts`). TTLs:

- `/players/nfl` — 24h (~5MB payload)
- `/league/{id}/rosters` — 1h
- Stats endpoints — 24h
- Trending — 1h

For multi-region production, swap the `Map` in `lib/sleeper.ts` for Redis.

## FantasyPros (optional)

Set `FANTASYPROS_API_KEY` to enable forward-looking data. Without it the app
works exactly as before — the integration degrades to empty maps rather than
erroring.

| Data | Endpoint |
|------|----------|
| Dynasty superflex ranks | `/nfl/{season}/consensus-rankings?position=OP&type=DYNASTY&scoring=PPR` |
| Rookie board | same, `type=ROOKIES` |
| Season projections | `/nfl/{season}/projections?position=ALL&week=0` |

`position=OP` is FantasyPros' "Offensive Player" set, i.e. superflex — matching
this league's format. Rankings join to Sleeper on `fantasypros_id` (72.6%
crosswalk coverage); projections join on `mfl_id` (100%) with `fpid` as
fallback.

## Deploying to Vercel

1. Push this branch to GitHub.
2. Import the repo in Vercel.
3. Set env vars: `ANTHROPIC_API_KEY`, optionally override
   `NEXT_PUBLIC_SLEEPER_LEAGUE_ID`, `NEXT_PUBLIC_MY_USER_ID`,
   `NEXT_PUBLIC_MY_ROSTER_ID`, `ANTHROPIC_MODEL`.

## Standalone apps

Two single-file apps predate this Next app and are preserved as static
files in `public/`, reachable from the nav:

| Route | What it is |
|-------|------------|
| `/lottery` | C_OKC Dynasty draft lottery simulator |
| `/thunder` | Thunder basketball live stats display |

`next.config.mjs` rewrites the extensionless routes to the underlying
`.html` files. The original `/lottery.html` and `/thunder.html` paths also
still resolve, so any existing links keep working.
