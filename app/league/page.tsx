import { MY_ROSTER_ID } from "@/lib/constants";
import { buildLeagueBundle } from "@/lib/league-service";
import PositionBadge from "@/components/PositionBadge";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function LeaguePage() {
  let errorMsg: string | null = null;
  let bundle = null;
  try {
    bundle = await buildLeagueBundle();
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Unknown error";
  }

  const teams = bundle?.teams ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl">League Intel</h1>
        <p className="text-muted font-cond text-sm uppercase tracking-wider">
          All 8 teams at a glance
        </p>
      </header>

      {errorMsg && (
        <div className="card p-5 border-red-500/40">
          <p className="text-red-400 font-display">Error</p>
          <p className="text-muted text-sm">{errorMsg}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {teams.map((t) => {
          const isMe = t.roster_id === MY_ROSTER_ID;
          return (
            <article
              key={t.roster_id}
              className={`card p-5 ${
                isMe ? "border-brand-orange/60 bg-[rgba(239,97,0,0.04)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-display text-xl">{t.team_name}</h2>
                  <div className="text-xs font-cond text-muted uppercase tracking-wider">
                    {t.display_name} · roster {t.roster_id}
                    {isMe && (
                      <span className="ml-2 pill bg-brand-orange/20 border-brand-orange/50 text-brand-orange">
                        YOU
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg">
                    {t.record.wins}-{t.record.losses}-{t.record.ties}
                  </div>
                  <div className="text-xs text-muted font-cond uppercase tracking-wider">
                    {t.total_fpts_2025.toFixed(0)} FPTS · age {t.avg_age}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-cond uppercase tracking-wider text-muted mb-2">
                  Key Starters
                </div>
                <div className="space-y-1">
                  {t.starters.slice(0, 6).map((p) => (
                    <div
                      key={p.player_id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PositionBadge pos={p.position} />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="font-display text-sm text-sky-300">
                        {p.ppg_2025 != null ? p.ppg_2025.toFixed(1) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
