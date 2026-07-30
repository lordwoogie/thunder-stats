import { POSITION_COLORS } from "@/lib/constants";

export default function PositionBadge({ pos }: { pos: string }) {
  const cls =
    POSITION_COLORS[pos] ??
    "text-slate-300 bg-slate-500/10 border-slate-500/30";
  return (
    <span className={`pill border ${cls}`}>
      {pos}
    </span>
  );
}
