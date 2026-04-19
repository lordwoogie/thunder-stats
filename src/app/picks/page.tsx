import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PicksForm from "@/components/PicksForm";

export const dynamic = "force-dynamic";

export default async function PicksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const series = await prisma.series.findMany({
    orderBy: [{ round: "asc" }, { conference: "asc" }, { slot: "asc" }],
  });
  const picks = await prisma.pick.findMany({
    where: { userId: user.id },
  });

  return (
    <div>
      <header className="mt-2 flex items-end justify-between">
        <div>
          <h1 className="display text-2xl sm:text-3xl">
            Your <span className="text-accent">Picks</span>
          </h1>
          <p className="label text-xs text-slate-400">{user.name}</p>
        </div>
      </header>
      <PicksForm
        series={series.map((s) => ({
          ...s,
          lockAt: s.lockAt ? s.lockAt.toISOString() : null,
        }))}
        picks={picks.map((p) => ({
          seriesId: p.seriesId,
          pickedWinner: p.pickedWinner,
          pickedGames: p.pickedGames,
          pointsAwarded: p.pointsAwarded,
        }))}
      />
    </div>
  );
}
