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
  try {
    const bundle = await buildLeagueBundle();
    rows = bundle.teams.find((t) => t.roster_id === MY_ROSTER_ID) ?? null;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Unknown error";
  }

  const players = rows ? flattenRoster(rows).sort(sortByPPG) : [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Full Stats</h1>
        <p className="text-muted font-cond text-sm uppercase tracking-wider">
          My roster · sorted by 2025 PPG
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
