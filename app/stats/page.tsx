import { buildLeagueBundle, flattenRoster } from "@/lib/league-service";
import { MY_ROSTER_ID } from "@/lib/constants";
import { sortByPPG } from "@/lib/enrich";
import PositionBadge from "@/components/PositionBadge";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function StatsPage() {
  let errorMsg: string | null = null;
  let rows: Awaited<ReturnType<typeof buildLeagueBundle>>["teams"][number] | null =
    null;
  let advancedSeason: string | null = null;
  try {
    const bundle = await buildLeagueBundle();
    rows = bundle.teams.find((t) => t.roster_id === MY_ROSTER_ID) ?? null;
    advancedSeason = bundle.advancedSeason;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Unknown error";
  }

  const players = rows ? flattenRoster(rows).sort(sortByPPG) : [];
  const pct = (v: number | null | undefined) =>
    v != null ? `${(v * 100).toFixed(1)}%` : "—";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Full Stats</h1>
        <p className="text-muted font-cond text-sm uppercase tracking-wider">
          My roster · sorted by PPG
          {advancedSeason
            ? ` · advanced metrics from nflverse ${advancedSeason}`
            : ""}
        </p>
      </header>

      {errorMsg && (
        <div className="card p-5 border-red-500/40">
          <p className="text-red-400 font-display">Error</p>
          <p className="text-muted text-sm">{errorMsg}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="tbl">
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>Team</th>
                <th>Age</th>
                <th>PPG</th>
                <th>FPTS</th>
                <th>G</th>
                <th title="Targets">TGT</th>
                <th title="Target share — % of team targets">TGT%</th>
                <th title="Weighted Opportunity Rating">WOPR</th>
                <th title="Expected Points Added (rec/rush/pass)">EPA</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.player_id}>
                  <td className="font-medium">{p.name}</td>
                  <td>
                    <PositionBadge pos={p.position} />
                  </td>
                  <td className="text-muted">{p.team}</td>
                  <td>{p.age ?? "—"}</td>
                  <td className="font-display text-lg">
                    {p.ppg_2025 != null ? p.ppg_2025.toFixed(1) : "—"}
                  </td>
                  <td className="text-muted">
                    {p.fpts_2025 != null ? p.fpts_2025.toFixed(1) : "—"}
                  </td>
                  <td className="text-dim">{p.games_2025 ?? "—"}</td>
                  <td className="text-muted">{p.advanced?.targets ?? "—"}</td>
                  <td
                    className={
                      (p.advanced?.target_share ?? 0) >= 0.22
                        ? "text-emerald-400 font-semibold"
                        : "text-muted"
                    }
                  >
                    {pct(p.advanced?.target_share)}
                  </td>
                  <td
                    className={
                      (p.advanced?.wopr ?? 0) >= 0.6
                        ? "text-emerald-400 font-semibold"
                        : "text-muted"
                    }
                  >
                    {p.advanced?.wopr != null
                      ? p.advanced.wopr.toFixed(2)
                      : "—"}
                  </td>
                  <td className="text-muted">
                    {(() => {
                      const a = p.advanced;
                      if (!a) return "—";
                      const epa =
                        a.receiving_epa ?? a.rushing_epa ?? a.passing_epa;
                      if (epa == null) return "—";
                      return (
                        <span
                          className={
                            epa > 0 ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {epa > 0 ? "+" : ""}
                          {epa.toFixed(1)}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    {p.injury_status ? (
                      <span className="text-red-400 text-xs">
                        {p.injury_status}
                      </span>
                    ) : (
                      <span className="text-dim text-xs">
                        {p.status ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="text-xs text-muted max-w-[240px]">
                    {p.note ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
