import { EnrichedPlayer } from "@/lib/types";
import PositionBadge from "./PositionBadge";

function ageTone(age: number | null): string {
  if (age == null) return "text-dim";
  if (age <= 24) return "text-emerald-400";
  if (age <= 27) return "text-ink";
  if (age <= 29) return "text-amber-400";
  return "text-red-400";
}

function ppgTone(ppg: number | null): string {
  if (ppg == null) return "text-dim";
  if (ppg >= 18) return "text-emerald-400 font-semibold";
  if (ppg >= 13) return "text-sky-300";
  if (ppg >= 9) return "text-ink";
  return "text-muted";
}

export default function PlayerRow({ p }: { p: EnrichedPlayer }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-bg-alt/70 hover:bg-bg-alt border border-transparent hover:border-brand-blue/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <PositionBadge pos={p.position} />
        <div className="min-w-0">
          <div className="font-medium truncate">{p.name}</div>
          <div className="text-xs text-muted font-cond">
            {p.team ?? "FA"}
            {p.age != null && (
              <>
                {" · "}
                <span className={ageTone(p.age)}>age {p.age}</span>
              </>
            )}
            {p.injury_status && (
              <>
                {" · "}
                <span className="text-red-400">{p.injury_status}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-display text-lg ${ppgTone(p.ppg_2025)}`}>
          {p.ppg_2025 != null ? p.ppg_2025.toFixed(1) : "—"}
        </div>
        <div className="text-[0.65rem] text-dim uppercase tracking-wider">
          {p.fpts_2025 != null ? `${p.fpts_2025} FPTS` : "2025 PPG"}
        </div>
      </div>
    </div>
  );
}
