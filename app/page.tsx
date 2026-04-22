import { buildLeagueBundle } from "@/lib/league-service";
import { LEAGUE_FORMAT, MY_ROSTER_ID } from "@/lib/constants";
import PlayerRow from "@/components/PlayerRow";
import Link from "next/link";
import { EnrichedPlayer } from "@/lib/types";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

function PositionCount({
  players
}: {
  players: EnrichedPlayer[];
}) {
  const counts = players.reduce<Record<string, number>>((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1;
    return acc;
  }, {});
  const order = ["QB", "RB", "WR", "TE", "K", "DEF"];
  return (
    <div className="flex flex-wrap gap-2">
      {order
        .filter((pos) => counts[pos])
        .map((pos) => (
          <span
            key={pos}
            className="pill bg-bg-alt border border-[rgba(0,122,193,0.2)] text-ink"
          >
            {pos} · {counts[pos]}
          </span>
        ))}
    </div>
  );
}

export default async function Dashboard() {
  let errorMsg: string | null = null;
  let bundle = null;
  try {
    bundle = await buildLeagueBundle();
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Unknown error";
  }

  const me = bundle?.teams.find((t) => t.roster_id === MY_ROSTER_ID);

  return (
    <div className="space-y-6">
      <section className="card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">
              {me?.team_name ?? "Lord Woogie"}
            </h1>
            <p className="text-muted font-cond text-sm tracking-wider uppercase">
              {LEAGUE_FORMAT.name} · {LEAGUE_FORMAT.size}-team{" "}
              {LEAGUE_FORMAT.format} · {LEAGUE_FORMAT.scoring}
            </p>
          </div>
          {me && (
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-muted font-cond text-xs uppercase tracking-wider">
                  Record
                </div>
                <div className="font-display text-xl">
                  {me.record.wins}-{me.record.losses}-{me.record.ties}
                </div>
              </div>
              <div>
                <div className="text-muted font-cond text-xs uppercase tracking-wider">
                  2025 FPTS
                </div>
                <div className="font-display text-xl text-brand-orange">
                  {me.total_fpts_2025.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-muted font-cond text-xs uppercase tracking-wider">
                  Avg Age
                </div>
                <div className="font-display text-xl text-sky-300">
                  {me.avg_age.toFixed(1)}
                </div>
              </div>
            </div>
          )}
        </div>
        {me && (
          <div className="mt-4">
            <PositionCount
              players={[...me.starters, ...me.bench, ...me.taxi, ...me.reserve]}
            />
          </div>
        )}
      </section>

      {errorMsg && (
        <section className="card p-5 border-red-500/40">
          <h2 className="font-display text-xl text-red-400 mb-2">
            Could not load league data
          </h2>
          <p className="text-muted text-sm">{errorMsg}</p>
          <p className="text-dim text-xs mt-2">
            The Sleeper API may be rate-limiting or down. Try refreshing.
          </p>
        </section>
      )}

      {me && (
        <div className="grid md:grid-cols-2 gap-5">
          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg text-brand-blue">
                Starters
              </h2>
              <span className="text-xs font-cond text-muted uppercase tracking-wider">
                {me.starters.length} slots
              </span>
            </div>
            <div className="space-y-2">
              {me.starters.map((p) => (
                <PlayerRow key={`${p.player_id}-s`} p={p} />
              ))}
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg text-brand-orange">Bench</h2>
              <span className="text-xs font-cond text-muted uppercase tracking-wider">
                {me.bench.length} players · sorted by PPG
              </span>
            </div>
            <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
              {me.bench.map((p) => (
                <PlayerRow key={`${p.player_id}-b`} p={p} />
              ))}
            </div>
          </section>

          {me.taxi.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-emerald-400">
                  Taxi Squad
                </h2>
                <span className="text-xs font-cond text-muted uppercase tracking-wider">
                  {me.taxi.length}/{LEAGUE_FORMAT.taxi_slots} slots
                </span>
              </div>
              <div className="space-y-2">
                {me.taxi.map((p) => (
                  <PlayerRow key={`${p.player_id}-t`} p={p} />
                ))}
              </div>
            </section>
          )}

          {me.reserve.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-red-400">
                  IR / Reserve
                </h2>
                <span className="text-xs font-cond text-muted uppercase tracking-wider">
                  {me.reserve.length}/{LEAGUE_FORMAT.ir_slots} slots
                </span>
              </div>
              <div className="space-y-2">
                {me.reserve.map((p) => (
                  <PlayerRow key={`${p.player_id}-r`} p={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <section className="card p-5">
        <h2 className="font-display text-lg mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/ai" className="btn-primary">
            Run AI Analysis
          </Link>
          <Link href="/trade" className="btn-ghost">
            Evaluate a Trade
          </Link>
          <Link href="/league" className="btn-ghost">
            League Intel
          </Link>
          <Link href="/stats" className="btn-ghost">
            Full Stats
          </Link>
        </div>
      </section>
    </div>
  );
}
