# C_OKC Dynasty — Playoff Pick'em

Series-by-series predictions for the 2026 NBA Playoffs, built for the C_OKC
Dynasty Fantrax league.

> This branch (`claude/nba-playoffs-pickem-V0aMa`) adds a full Next.js app at
> the repo root. The legacy Thunder stats page (`index.html`) remains in tree
> but is not served by the Next.js app.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + Postgres (Vercel / Neon / Supabase)
- NextAuth.js (credentials provider, bcrypt, JWT sessions)
- Deploy target: Vercel

## Scoring

Per series, once the real result is final:

- **3 pts** — correct winner AND exact games
- **2 pts** — correct winner, games off by 1
- **1 pt** — correct winner, games off by 2+
- **0 pts** — wrong winner

Pick lock:

- **Round 1**: locks at tip-off of Game 2 (honor system until then)
- **Later rounds**: lock at tip-off of Game 1
- Admin can override any lock time in `/admin → Series`

## Local setup

```bash
pnpm install       # or npm install / yarn
cp .env.example .env
# fill DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, seed passwords
npx prisma migrate dev --name init
npx prisma db seed
pnpm dev
```

Open <http://localhost:3000>. Sign in as `lordwoogie` with
`ADMIN_SEED_PASSWORD`. All other accounts use `DEFAULT_USER_PASSWORD` on first
login and will be forced to change it.

## Deployment (Vercel)

1. Create a Vercel Postgres database, copy the `DATABASE_URL` into the project env.
1. Add `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and `NEXTAUTH_URL` (your deployed URL).
1. Add `ADMIN_SEED_PASSWORD` + `DEFAULT_USER_PASSWORD` — temporary seed values.
1. Deploy. In the Vercel dashboard, run:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

1. Hand out usernames + the default password in the league chat.

## Repo layout

```
prisma/
  schema.prisma     # User, Series, Pick
  seed.ts           # creates league users + R1 matchups + bracket placeholders
src/
  app/
    login/          # credentials sign-in
    change-password # forced on first login
    picks/          # main player view — round tabs, team buttons, lock/saved state
    leaderboard/    # sorted standings with 3-pt tiebreaker
    bracket/        # visual read-only bracket
    admin/          # commish console (results, series edit, users)
    api/            # NextAuth + REST handlers
  components/       # Nav, PicksForm, AdminDashboard
  lib/              # prisma client, auth options, scoring, utils, team meta
  middleware.ts     # requires auth; forces password change; gates /admin
```

## Admin flow

1. `/admin → Enter results` — pick a series, choose winner + games, hit
   **Mark final**. This scores all picks and auto-fills the next round's
   matchup (winner gets slotted into the parent series).
1. `/admin → Series` — edit lock times or fix matchups.
1. `/admin → Users` — toggle admin flag or reset a user's password to a
   temporary value (displayed once; share via DM/text).

## League members (pre-seeded)

| Team | Username |
| --- | --- |
| BLAKE | `blake` |
| Matas Mouse | `matasmouse` |
| go15hawks | `go15hawks` |
| blayzehembree | `blayzehembree` |
| evantraylor | `evantraylor` |
| Culture Club | `cultureclub` |
| Lordwoogie (admin) | `lordwoogie` |
| Colangelo's Sentient Collars | `colangelo` |
| #TOPIĆSTRONG | `topicstrong` |
| KL2 Aspire LLC | `kl2aspire` |

## Round 1 matchups (2026)

### East

- (1) Detroit Pistons vs (8) Orlando Magic
- (4) Cleveland Cavaliers vs (5) Toronto Raptors
- (2) Boston Celtics vs (7) Philadelphia 76ers
- (3) New York Knicks vs (6) Atlanta Hawks

### West

- (1) Oklahoma City Thunder vs (8) Phoenix Suns
- (4) Los Angeles Lakers vs (5) Houston Rockets
- (2) San Antonio Spurs vs (7) Portland Trail Blazers
- (3) Denver Nuggets vs (6) Minnesota Timberwolves

Semis, conference finals, and the NBA Finals are pre-created as bracket
placeholders and auto-fill as earlier rounds are marked final.

## Extending

- Per-round scoring multipliers — edit `src/lib/scoring.ts`; the signature
  already receives the series so you can branch on `series.round`.
- Auto-fetch results from `balldontlie.io` — fire a cron hitting a new
  `/api/cron/sync-series` endpoint that calls the same logic as the admin
  finalize path.
- Trash talk — add a `Comment` model with `userId` + `seriesId` and render on
  the series card.

## Legacy Thunder stats

The original static dashboard lives at `index.html`. It is unused by the
Next.js build. Host it separately (or move into `/public/legacy/`) if you want
to keep it reachable.
