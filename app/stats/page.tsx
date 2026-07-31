import { buildLeagueBundle, flattenRoster } from "@/lib/league-service";
import { MY_ROSTER_ID, SEASON } from "@/lib/constants";
import { sortByPPG } from "@/lib/enrich";
import PositionBadge from "@/components/PositionBadge";
import { EnrichedPlayer } from "@/lib/types";
import { describeDepth } from "@/lib/depth-charts";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const pct = (v: number | null | undefined) =>
  v != null ? `${(v * 100).toFixed(1)}%` : "—";
const nOr = (v: number | null | undefined, dp = 0) =>
  v != null ? v.toFixed(dp) : "—";

/** Threshold coloring so the eye lands on the outliers. */
function tone(v: number | null | undefined, good: number, bad: number) {
  if (v == null) return "text-muted";
  if (v >= good) return "text-emerald-400 font-semibold";
  if (v <= bad) return "text-red-400";
  return "text-ink";
}

function Th({
  children,
  title
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return <th title={title}>{children}</th>;
}

function DepthCell({ p }: { p: EnrichedPlayer }) {
  const d = p.depth;
  const label = describeDepth(d);
  if (!label) return <td className="text-dim text-xs">—</td>;
  const buried = (d?.ahead.length ?? 0) > 0;
  return (
    <td
      className={`text-xs ${buried ? "text-amber-400" : "text-emerald-400"}`}
      title={
        d && d.ahead.length > 0
          ? `Ahead: ${d.ahead.map((m) => m.name).join(", ")}`
          : undefined
      }
    >
      {label}
    </td>
  );
}

function NameCell({ p }: { p: EnrichedPlayer }) {
  return (
    <td>
      <div className="font-medium">{p.name}</div>
      <div className="text-[0.7rem] text-dim font-cond">
        {p.team}
        {p.age != null ? ` · ${p.age}y` : ""}
        {p.injury_status ? (
          <span className="text-red-400"> · {p.injury_status}</span>
        ) : null}
      </div>
    </td>
  );
}

function QbTable({ players }: { players: EnrichedPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <section className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(0,122,193,0.15)]">
        <h2 className="font-display text-lg text-red-400">Quarterbacks</h2>
        <p className="text-xs text-muted font-cond uppercase tracking-wider">
          Superflex — rushing volume is the separator
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <Th>Player</Th>
              <Th>PPG</Th>
              <Th>G</Th>
              <Th title="Pass attempts">ATT</Th>
              <Th title="Attempts per game">ATT/G</Th>
              <Th title="Completion percentage">CMP%</Th>
              <Th title="Yards per attempt">Y/A</Th>
              <Th>TD</Th>
              <Th>INT</Th>
              <Th title="Rush attempts">RU ATT</Th>
              <Th title="Rush yards">RU YD</Th>
              <Th title="Rush TDs">RU TD</Th>
              <Th title="Snap share">SNAP%</Th>
              <Th title="NFL depth chart standing">DEPTH</Th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const u = p.usage;
              return (
                <tr key={p.player_id}>
                  <NameCell p={p} />
                  <td className="font-display text-lg">
                    {nOr(p.ppg_2025, 1)}
                  </td>
                  <td className="text-dim">{u?.games ?? p.games_2025 ?? "—"}</td>
                  <td className="text-muted">{u?.pass_attempts ?? "—"}</td>
                  <td className={tone(u?.pass_attempts_per_game, 32, 18)}>
                    {nOr(u?.pass_attempts_per_game, 1)}
                  </td>
                  <td className={tone(u?.completion_pct, 0.67, 0.6)}>
                    {pct(u?.completion_pct)}
                  </td>
                  <td className={tone(u?.yards_per_attempt, 7.5, 6.3)}>
                    {nOr(u?.yards_per_attempt, 1)}
                  </td>
                  <td className="text-muted">{u?.passing_tds ?? "—"}</td>
                  <td className="text-muted">{u?.interceptions ?? "—"}</td>
                  <td className={tone(u?.carries, 60, 15)}>
                    {u?.carries ?? "—"}
                  </td>
                  <td className={tone(u?.rushing_yards, 350, 80)}>
                    {u?.rushing_yards ?? "—"}
                  </td>
                  <td className={tone(u?.rushing_tds, 4, 0)}>
                    {u?.rushing_tds ?? "—"}
                  </td>
                  <td className="text-muted">{pct(u?.snap_share)}</td>
                  <DepthCell p={p} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RbTable({ players }: { players: EnrichedPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <section className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(0,122,193,0.15)]">
        <h2 className="font-display text-lg text-emerald-400">Running Backs</h2>
        <p className="text-xs text-muted font-cond uppercase tracking-wider">
          Workload &gt; name value — carry share and snaps tell the truth
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <Th>Player</Th>
              <Th>PPG</Th>
              <Th>G</Th>
              <Th title="Carries">CAR</Th>
              <Th title="Share of team carries">CAR%</Th>
              <Th title="Yards per carry">YPC</Th>
              <Th title="Rush yards">RU YD</Th>
              <Th>TD</Th>
              <Th title="Targets">TGT</Th>
              <Th title="Receptions">REC</Th>
              <Th title="Share of team carries + targets">TOUCH%</Th>
              <Th title="Touches per game">TCH/G</Th>
              <Th title="Snap share">SNAP%</Th>
              <Th title="Carries inside the 20">RZ CAR</Th>
              <Th title="Touches inside the 10 — goal-line role">I10</Th>
              <Th title="NFL depth chart standing">DEPTH</Th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const u = p.usage;
              return (
                <tr key={p.player_id}>
                  <NameCell p={p} />
                  <td className="font-display text-lg">
                    {nOr(p.ppg_2025, 1)}
                  </td>
                  <td className="text-dim">{u?.games ?? p.games_2025 ?? "—"}</td>
                  <td className="text-muted">{u?.carries ?? "—"}</td>
                  <td className={tone(u?.carry_share, 0.5, 0.2)}>
                    {pct(u?.carry_share)}
                  </td>
                  <td className={tone(u?.yards_per_carry, 4.6, 3.8)}>
                    {nOr(u?.yards_per_carry, 1)}
                  </td>
                  <td className="text-muted">{u?.rushing_yards ?? "—"}</td>
                  <td className="text-muted">
                    {(u?.rushing_tds ?? 0) + (u?.receiving_tds ?? 0) || "—"}
                  </td>
                  <td className="text-muted">{u?.targets ?? "—"}</td>
                  <td className="text-muted">{u?.receptions ?? "—"}</td>
                  <td className={tone(u?.touch_share, 0.35, 0.12)}>
                    {pct(u?.touch_share)}
                  </td>
                  <td className={tone(u?.touches_per_game, 15, 6)}>
                    {nOr(u?.touches_per_game, 1)}
                  </td>
                  <td className={tone(u?.snap_share, 0.65, 0.35)}>
                    {pct(u?.snap_share)}
                  </td>
                  <td className={tone(p.advanced?.rz_carries, 30, 8)}>
                    {p.advanced?.rz_carries ?? "—"}
                  </td>
                  <td className={tone(p.advanced?.i10_opportunities, 18, 5)}>
                    {p.advanced?.i10_opportunities ?? "—"}
                  </td>
                  <DepthCell p={p} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PassCatcherTable({ players }: { players: EnrichedPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <section className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(0,122,193,0.15)]">
        <h2 className="font-display text-lg text-sky-400">
          Receivers &amp; Tight Ends
        </h2>
        <p className="text-xs text-muted font-cond uppercase tracking-wider">
          Target share is the leading indicator
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <Th>Player</Th>
              <Th>PPG</Th>
              <Th>G</Th>
              <Th title="Targets">TGT</Th>
              <Th title="Share of team targets">TGT%</Th>
              <Th title="Targets per game">TGT/G</Th>
              <Th title="Receptions">REC</Th>
              <Th title="Catch rate">CATCH%</Th>
              <Th title="Receiving yards">YDS</Th>
              <Th title="Yards per target">Y/TGT</Th>
              <Th>TD</Th>
              <Th title="Snap share">SNAP%</Th>
              <Th title="Weighted Opportunity Rating">WOPR</Th>
              <Th title="Targets inside the 20">RZ TGT</Th>
              <Th title="Touches inside the 10 — goal-line role">I10</Th>
              <Th title="NFL depth chart standing">DEPTH</Th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const u = p.usage;
              return (
                <tr key={p.player_id}>
                  <NameCell p={p} />
                  <td className="font-display text-lg">
                    {nOr(p.ppg_2025, 1)}
                  </td>
                  <td className="text-dim">{u?.games ?? p.games_2025 ?? "—"}</td>
                  <td className="text-muted">{u?.targets ?? "—"}</td>
                  <td className={tone(u?.target_share, 0.22, 0.12)}>
                    {pct(u?.target_share)}
                  </td>
                  <td className={tone(u?.targets_per_game, 7, 3)}>
                    {nOr(u?.targets_per_game, 1)}
                  </td>
                  <td className="text-muted">{u?.receptions ?? "—"}</td>
                  <td className={tone(u?.catch_rate, 0.7, 0.55)}>
                    {pct(u?.catch_rate)}
                  </td>
                  <td className="text-muted">{u?.receiving_yards ?? "—"}</td>
                  <td className={tone(u?.yards_per_target, 9, 6)}>
                    {nOr(u?.yards_per_target, 1)}
                  </td>
                  <td className="text-muted">{u?.receiving_tds ?? "—"}</td>
                  <td className="text-muted">{pct(u?.snap_share)}</td>
                  <td
                    className={
                      (p.advanced?.wopr ?? 0) >= 0.6
                        ? "text-emerald-400 font-semibold"
                        : "text-dim"
                    }
                  >
                    {p.advanced?.wopr != null
                      ? p.advanced.wopr.toFixed(2)
                      : "—"}
                  </td>
                  <td className={tone(p.advanced?.rz_targets, 15, 4)}>
                    {p.advanced?.rz_targets ?? "—"}
                  </td>
                  <td className={tone(p.advanced?.i10_opportunities, 8, 2)}>
                    {p.advanced?.i10_opportunities ?? "—"}
                  </td>
                  <DepthCell p={p} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function StatsPage() {
  let errorMsg: string | null = null;
  let team: Awaited<ReturnType<typeof buildLeagueBundle>>["teams"][number] | null =
    null;
  let advancedSeason: string | null = null;
  try {
    const bundle = await buildLeagueBundle();
    team = bundle.teams.find((t) => t.roster_id === MY_ROSTER_ID) ?? null;
    advancedSeason = bundle.advancedSeason;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Unknown error";
  }

  const players = team ? flattenRoster(team).sort(sortByPPG) : [];
  const byPos = (...want: string[]) =>
    players.filter((p) => want.includes(p.position.toUpperCase()));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Full Stats</h1>
        <p className="text-muted font-cond text-sm uppercase tracking-wider">
          My roster · {SEASON} usage &amp; opportunity
          {advancedSeason
            ? ` · *WOPR from nflverse ${advancedSeason}`
            : ""}
        </p>
      </header>

      {errorMsg && (
        <div className="card p-5 border-red-500/40">
          <p className="text-red-400 font-display">Error</p>
          <p className="text-muted text-sm">{errorMsg}</p>
        </div>
      )}

      <QbTable players={byPos("QB")} />
      <RbTable players={byPos("RB")} />
      <PassCatcherTable players={byPos("WR", "TE")} />

      {byPos("K", "DEF").length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(0,122,193,0.15)]">
            <h2 className="font-display text-lg text-slate-300">K / DEF</h2>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <Th>Player</Th>
                <Th>Pos</Th>
                <Th>Team</Th>
                <Th>PPG</Th>
                <Th>FPTS</Th>
              </tr>
            </thead>
            <tbody>
              {byPos("K", "DEF").map((p) => (
                <tr key={p.player_id}>
                  <td className="font-medium">{p.name}</td>
                  <td>
                    <PositionBadge pos={p.position} />
                  </td>
                  <td className="text-muted">{p.team}</td>
                  <td className="font-display">{nOr(p.ppg_2025, 1)}</td>
                  <td className="text-muted">{nOr(p.fpts_2025, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
