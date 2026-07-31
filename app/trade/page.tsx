import TradeForm, { TradeTeam } from "@/components/TradeForm";
import { MY_ROSTER_ID } from "@/lib/constants";
import { buildLeagueBundle, flattenRoster } from "@/lib/league-service";

// Matches the other data pages: render per request so a build-time Sleeper
// outage can't bake a stale roster list (or an error) into the deployment.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function TradePage() {
  let teams: TradeTeam[] = [];
  let loadError: string | null = null;

  try {
    const bundle = await buildLeagueBundle();
    // Trim to what the picker needs. The full bundle carries advanced stats,
    // depth info and projections for every rostered player — far more than a
    // dropdown should ship to the browser.
    teams = bundle.teams.map((t) => ({
      roster_id: t.roster_id,
      team_name: t.team_name,
      display_name: t.display_name,
      players: flattenRoster(t)
        .filter((p) => p.player_id)
        .map((p) => ({
          id: p.player_id,
          name: p.name,
          position: p.position,
          team: p.team,
          ppg: p.ppg_2025,
          rank: p.rank?.ecr ?? null
        }))
        // Market rank first so the assets that actually move a trade are at
        // the top of the list; unranked depth falls to the bottom.
        .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)),
      picks: t.picks.map((p) => ({ id: p.id, label: p.label }))
    }));
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load league";
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">Trade Analyzer</h1>
        <p className="text-muted font-cond text-sm uppercase tracking-wider">
          Propose a deal · get a dynasty verdict with stats context
        </p>
      </header>
      <TradeForm teams={teams} myRosterId={MY_ROSTER_ID} loadError={loadError} />
    </div>
  );
}
