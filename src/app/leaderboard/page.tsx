import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const me = session.user as any;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      teamName: true,
      username: true,
      picks: {
        select: {
          pointsAwarded: true,
          series: { select: { isFinal: true, round: true } },
        },
      },
    },
  });

  // Determine current round = max round that has any final series
  const allSeries = await prisma.series.findMany({ select: { round: true, isFinal: true } });
  const currentRound = Math.max(
    1,
    ...allSeries.filter((s) => s.isFinal).map((s) => s.round)
  );

  type Row = {
    userId: string;
    teamName: string;
    username: string;
    total: number;
    round: number;
    perfects: number;
  };

  const rows: Row[] = users.map((u) => {
    let total = 0;
    let round = 0;
    let perfects = 0;
    for (const p of u.picks) {
      const pts = p.pointsAwarded ?? 0;
      if (!p.series.isFinal) continue;
      total += pts;
      if (p.series.round === currentRound) round += pts;
      if (pts === 3) perfects += 1;
    }
    return { userId: u.id, teamName: u.teamName, username: u.username, total, round, perfects };
  });

  rows.sort(
    (a, b) =>
      b.total - a.total ||
      b.perfects - a.perfects ||
      a.teamName.localeCompare(b.teamName)
  );

  return (
    <div className="mt-2">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="display text-2xl sm:text-3xl">
            <span className="text-accent">Leaderboard</span>
          </h1>
          <p className="label text-xs text-slate-400">C_OKC Dynasty</p>
        </div>
      </header>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-court-alt/70 text-left">
            <tr className="label text-xs text-slate-400">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-right">Round</th>
              <th className="px-4 py-3 text-right">3-pt</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.userId}
                className={cn(
                  "border-t border-court-line",
                  r.userId === me.id && "bg-accent/5"
                )}
              >
                <td className="px-4 py-3 font-semibold text-slate-400">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.teamName}</div>
                  <div className="text-xs text-slate-500">@{r.username}</div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.round}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.perfects}</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-accent">
                  {r.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
