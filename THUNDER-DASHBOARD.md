# Church of Thunder — Live Stats TV Dashboard

Handoff notes for the TV dashboard that lives in `index.html`. The rest of this repo
is The Octogon (Sleeper dynasty analyzer, see `CLAUDE.md` / `README.md`); GitHub
Pages serves `index.html` from `main`, Vercel serves the Next.js app.

## What this is

A single-file HTML dashboard that shows live OKC Thunder scores on a taproom TV
during watch parties at Lively Beerworks / Cowboy Cold ("Church of Thunder" events).
Staff open one URL, press F for fullscreen, and walk away. No server, no build step.

- **Live URL:** https://lordwoogie.github.io/thunder-stats
- **Repo:** github.com/lordwoogie/thunder-stats (GitHub Pages, branch `main`, folder `/`)
- **Entry point:** `index.html` — must keep this exact name or Pages falls back to README.md
- **Owner:** Nick Williams (nick@livelybeer.com), GitHub `lordwoogie`

## Architecture

- One self-contained `index.html` (~27 KB): inline CSS + vanilla JS, no dependencies
  except Google Fonts (Oswald, Barlow, Barlow Condensed).
- Data source: **balldontlie API, free tier**
  - Base URL: `https://api.balldontlie.io/nba/v1` (the `/nba/` prefix is required — `/v1/` alone 401s)
  - Auth: `Authorization: <api key>` header (no "Bearer" prefix)
  - Free tier = 5 requests/min. Only `teams`, `players`, `games` endpoints.
  - Player box scores (`/stats`) and betting odds need paid tiers (ALL-STAR $9.99/mo, GOAT $39.99/mo). Nick chose to stay free.
- API key is stored in `localStorage` under key `cot_key` on the device, never in the repo.
  First load shows a setup screen asking for the key; after that it goes straight to the dashboard.
- Why GitHub Pages: opening the HTML as a local `file://` blocks the API call (CORS).
  It has to be served from a real origin.

## Screens / states

1. **Setup** — one-time API key entry, verifies key against `/teams` before saving.
2. **Boot** — spinner while first fetch runs; retries every 10s on failure.
3. **Game view** — scoreboard (big scores, Thunder in blue), quarter-by-quarter grid,
   other NBA games as small cards, scrolling ticker of all scores.
4. **Pregame / no game** — "Thunder Up" screen, next game card with countdown, upcoming schedule.

## Refresh logic

- Live game (status contains "qtr"/"quarter"/"half"): every **30s**
- Otherwise (no game, pregame, final): every **5 min**
- Also refetches on `visibilitychange` (tab regains focus)
- One API call per refresh (`/games?dates[]=YYYY-MM-DD` in America/Chicago).
  Upcoming schedule is fetched once and cached in memory.
- Keyboard: **F** = fullscreen, **R** = force refresh

## Status (Oct 20 2026)

Done:

1. **Pregame status renders as "Tip-off 8:30 PM CT"** instead of the raw ISO
   timestamp balldontlie returns in `status`. Detected with `/^\d{4}-\d{2}-\d{2}T/`
   (`statusKind()` / `statusText()` in `index.html`). Applies to the main
   scoreboard, the other-game cards and the ticker. The scoreboard also shows a
   countdown to tip when a Thunder game is scheduled today.
2. **Pregame polling is 60s** whenever there is a Thunder game today that has not
   started, so the start of the game is caught within a minute. Live stays 30s,
   no game / final stays 5 min. (`desiredPollMs()`.)
3. **Lightning-bolt logo in the header**, inline SVG in Thunder blue/orange, plus
   a "Cowboy Cold · Lively Beerworks" tag and a favicon. Swap the SVG for a real
   Church of Thunder / Cowboy Cold logo file when one exists.
4. Upcoming-schedule cache now refreshes when the Central-time date rolls over
   (it used to be fetched once and never again), and its dates are computed in
   America/Chicago rather than UTC.
5. Quarter grid handles up to four overtimes and accepts either `home_q1` or
   `home_team_q1` field naming from the API.
6. Fixed a CSS clash where the quarter-grid header cells inherited the top
   bar's `.header` styles.

Not done:

- Player box score panels — needs the ALL-STAR tier (`/stats`). An earlier
  version had this: two side-by-side tables, Thunder + opponent, sorted by PTS,
  20+ highlighted in yellow, using `/stats?game_ids[]=<id>&per_page=100`.

Unverified: `api.balldontlie.io` and its docs are blocked from the Claude Code
cloud environment, so the Oct 20 changes were tested against mocked API
responses (Playwright, four states: pregame today, live, final, no game), not
the live API. Field names for quarter scores are the ones the previous version
used; if the grid ever fails to appear during a live game, check the real
`/games` payload in the browser console.

`public/thunder.html` is a byte-for-byte copy of `index.html` so the Vercel
(Octogon) deployment can also serve it at `/thunder.html`. Keep them in sync.

## Gotchas learned the hard way

- The repo once got the **Octogon (Sleeper dynasty analyzer)** project pushed into it,
  which deleted `index.html` and Pages started serving Octogon's README. If the live
  URL shows a README, that's what happened — re-upload `index.html` to the root.
- Don't rename `index.html`.
- `localStorage` is per-browser. If the TV device's browser cache is cleared, staff
  must re-enter the API key (Nick has it).
- 429 from the API = rate limited; code waits 15s and retries once.

## Staff SOP

A Word doc (`Thunder-Dashboard-SOP.docx`) exists with bartender instructions:
plug device into TV → open URL → press F → done; plus a troubleshooting table.
Keep it in sync if the URL or keyboard shortcuts change.

## Brand / style

- Colors: Thunder blue `#007AC1`, dark navy `#002D62`, orange `#EF6100`, yellow `#FDBB30`
- Background `#0A0E1A`, cards `#111827` / `#1A2236`
- Fonts: Oswald (display), Barlow Condensed (labels/ticker), Barlow (body)
- Tone: broadcast-scoreboard look, high contrast, readable from across a bar.
