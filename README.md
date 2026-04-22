# The Octogon — Sleeper Dynasty Analyzer

Next.js app for Nick's Sleeper dynasty league **The Octogon** (8-team Superflex,
Full PPR). Pulls live rosters from the Sleeper API, enriches them with 2025
season stats, and uses Claude (Anthropic) for on-demand analysis.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Anthropic SDK (Claude Sonnet 4.6 by default)
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
| `/league`  | All 8 teams at a glance with key starters and totals              |
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

## Deploying to Vercel

1. Push this branch to GitHub.
2. Import the repo in Vercel.
3. Set env vars: `ANTHROPIC_API_KEY`, optionally override
   `NEXT_PUBLIC_SLEEPER_LEAGUE_ID`, `NEXT_PUBLIC_MY_USER_ID`,
   `NEXT_PUBLIC_MY_ROSTER_ID`, `ANTHROPIC_MODEL`.

## Legacy

The prior Thunder basketball stats display lives at `/thunder.html` (served
statically from `public/`).
