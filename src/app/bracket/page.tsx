import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoUrl } from "@/lib/teams";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const series = await prisma.series.findMany({
    orderBy: [{ round: "asc" }, { slot: "asc" }],
  });

  const rounds = [1, 2, 3, 4];
  const east = series.filter((s) => s.conference === "East");
  const west = series.filter((s) => s.conference === "West");
  const finals = series.filter((s) => s.slot === "FINALS");

  return (
    <div className="mt-2">
      <h1 className="display text-2xl sm:text-3xl">
        2026 <span className="text-accent">Bracket</span>
      </h1>
      <p className="label mt-1 text-xs text-slate-400">Updated as admin enters results</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Conference title="East" series={east} />
        <Conference title="West" series={west} />
      </div>
      <div className="mt-4">
        <h2 className="label mb-2 text-xs text-slate-400">NBA Finals</h2>
        {finals.map((s) => (
          <MiniSeries key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}

function Conference({
  title,
  series,
}: {
  title: string;
  series: Awaited<ReturnType<typeof prisma.series.findMany>>;
}) {
  const byRound: Record<number, typeof series> = { 1: [], 2: [], 3: [] };
  for (const s of series) byRound[s.round]?.push(s);
  return (
    <div className="card p-4">
      <h2 className="display text-lg">{title}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((r) => (
          <div key={r} className="space-y-2">
            <div className="label text-[10px] text-slate-500">R{r}</div>
            {byRound[r].map((s) => (
              <MiniSeries key={s.id} s={s} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniSeries({ s }: { s: Awaited<ReturnType<typeof prisma.series.findMany>>[number] }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2 text-xs",
        s.isFinal ? "border-emerald-800/50 bg-emerald-950/20" : "border-court-line bg-court-bg"
      )}
    >
      <TeamRow
        name={s.higherSeed}
        abbr={s.higherSeedAbbr}
        seed={s.higherSeedNum}
        win={s.winner === s.higherSeed}
      />
      <TeamRow
        name={s.lowerSeed}
        abbr={s.lowerSeedAbbr}
        seed={s.lowerSeedNum}
        win={s.winner === s.lowerSeed}
      />
      {s.isFinal && (
        <div className="mt-1 text-[10px] text-emerald-300">
          {s.winner} in {s.gamesPlayed}
        </div>
      )}
    </div>
  );
}

function TeamRow({
  name,
  abbr,
  seed,
  win,
}: {
  name: string | null;
  abbr: string | null;
  seed: number | null;
  win: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 py-0.5", win && "font-semibold text-emerald-300")}>
      {abbr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl(abbr)} alt={abbr} className="h-5 w-5 shrink-0" />
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border border-court-line" />
      )}
      <span className="truncate">
        {seed ? <span className="text-slate-500">#{seed} </span> : null}
        {name || <span className="italic text-slate-500">TBD</span>}
      </span>
    </div>
  );
}
