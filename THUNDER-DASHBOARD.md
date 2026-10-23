# Church of Thunder — Live Stats TV Dashboard

Working notes for the taproom dashboard. This repo also holds the Octogon
Sleeper analyzer (Next.js, see `CLAUDE.md` / `README.md`); the two projects
share the repo but nothing else. **Never delete or rename `index.html`.**

## What this is

A single-file HTML dashboard that shows live OKC Thunder scores on a taproom TV
during watch parties at Lively Beerworks / Cowboy Cold ("Church of Thunder" events).
Staff open one URL, press F for fullscreen, and walk away. No server, no build step.

- **Live URL:** https://lordwoogie.github.io/thunder-stats
- **Hosting:** GitHub Pages, branch `main`, folder `/`. `.nojekyll` is checked in so
  Pages serves files as-is instead of running Jekyll over the Octogon tree.
- **Entry point:** `index.html` — must keep this exact name or Pages falls back to README.md
- **Owner:** Nick Williams (nick@livelybeer.com), GitHub `lordwoogie`

## Architecture

- One self-contained `index.html`: inline CSS + vanilla JS, no dependencies
  except Google Fonts (Oswald, Barlow, Barlow Condensed).
- Data source: **balldontlie API, free tier**
  - Base URL: `https://api.balldontlie.io/nba/v1` (the `/nba/` prefix is required — `/v1/` alone 401s)
  - Auth: `Authorization: <api key>` header (no "Bearer" prefix)
  - Free tier = 5 requests/min. Only `teams`, `players`, `games` endpoints.
  - Player box scores (`/stats`) need a paid tier (ALL-STAR $9.99/mo or up).
- API key is stored in `localStorage` under key `cot_key` on the device, never in the repo.
  First load shows a setup screen asking for the key; after that it goes straight to the dashboard.
- Why GitHub Pages: opening the HTML as a local `file://` blocks the API call (CORS).
  It has to be served from a real origin.

## Screens / states

1. **Setup** — one-time API key entry, verifies key against `/teams` before saving.
   Press **K** on the dashboard to reopen it (Cancel keeps the existing key).
2. **Boot** — spinner while first fetch runs; retries every 10s on failure.
3. **Game today, not started** — matchup card with "Tip-off 7:00 PM CT" badge and a
   countdown to tip, plus other games around the league.
4. **Live** — scoreboard (big scores, Thunder in blue), quarter-by-quarter grid, other
   NBA games as small cards, scrolling ticker of all scores. If the API key is on a
   paid tier, two box-score panels (Thunder + opponent, top 7 by PTS, 20+ in yellow)
   replace the other-game cards automatically.
5. **Final** — final score, quarter grid, "Next: vs LAL · Sat, Oct 25 · 7:00 PM CT".
6. **No game today** — "Thunder Up" screen, next game card with countdown, upcoming schedule.

## Refresh logic

- Live game: every **30s**
- Thunder game today but not started yet: every **60s** (so the start isn't missed)
- Otherwise (no game, final, postponed): every **5 min**
- Also refetches on `visibilitychange` (tab regains focus); overlapping fetches are skipped.
- Dates are computed in America/Chicago. One `/games?dates[]=YYYY-MM-DD` call per refresh.
  The 7-day upcoming schedule is fetched once per CT calendar day, so a TV left on
  overnight rolls forward on its own.
- Box score: on a live game the page tries `/stats?game_ids[]=<id>&per_page=100` once;
  a 401/403 (free tier) disables it for that page load. Budget on a paid key is
  4 req/min while live.
- 429 from the API = rate limited; code waits 15s and retries once.
- Keyboard: **F** = fullscreen, **R** = force refresh, **K** = change API key

## Status parsing (balldontlie quirks)

- Before tip-off, `status` is an ISO timestamp (e.g. `2026-10-21T01:30:00Z`); detected
  with `/^\d{4}-\d{2}-\d{2}T/` and rendered as a CT time.
- Live: `status` like `3rd Qtr` / `Halftime`, `time` like `7:22`, `period` > 0.
- Final: `status` contains `Final`.
- Anything else (Postponed etc.) is shown verbatim and polled every 5 min.

## Logo

The header shows an inline lightning bolt. Drop a `logo.png` next to `index.html`
(about 40px tall when rendered) and it replaces the bolt automatically; nothing
else to change.

## Gotchas learned the hard way

- The Octogon project was once pushed into this repo and deleted `index.html`, so
  Pages served Octogon's README. If the live URL shows a README, that's what
  happened — restore `index.html` at the root.
- `public/thunder.html` is an older copy of the dashboard that the Octogon app serves
  from Vercel. It is not what Pages serves and is not kept in sync.
- `localStorage` is per-browser. If the TV device's browser cache is cleared, staff
  must re-enter the API key (Nick has it) — press K, or it prompts on load.
- This cloud environment cannot reach `api.balldontlie.io` or `lordwoogie.github.io`,
  so changes are verified offline with a mocked API (see git history for the
  Playwright smoke test used). Anything touching real API responses ships unverified
  against live data.

## Staff SOP

A Word doc (`Thunder-Dashboard-SOP.docx`) exists with bartender instructions:
plug device into TV → open URL → press F → done; plus a troubleshooting table.
Keep it in sync if the URL or keyboard shortcuts change (K was added Oct 2026).

## Brand / style

- Colors: Thunder blue `#007AC1`, dark navy `#002D62`, orange `#EF6100`, yellow `#FDBB30`
- Background `#0A0E1A`, cards `#111827` / `#1A2236`
- Fonts: Oswald (display), Barlow Condensed (labels/ticker), Barlow (body)
- Tone: broadcast-scoreboard look, high contrast, readable from across a bar.
