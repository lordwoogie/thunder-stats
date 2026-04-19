import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

const PatchSchema = z.object({
  winner: z.string().nullable().optional(),
  gamesPlayed: z.number().int().min(4).max(7).nullable().optional(),
  isFinal: z.boolean().optional(),
  lockAt: z.string().nullable().optional(),
  higherSeed: z.string().nullable().optional(),
  higherSeedAbbr: z.string().nullable().optional(),
  higherSeedNum: z.number().int().nullable().optional(),
  lowerSeed: z.string().nullable().optional(),
  lowerSeedAbbr: z.string().nullable().optional(),
  lowerSeedNum: z.number().int().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const existing = await prisma.series.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Series not found" }, { status: 404 });

  const d = parsed.data;

  // If trying to finalize, validate
  if (d.isFinal) {
    const winner = d.winner ?? existing.winner;
    const games = d.gamesPlayed ?? existing.gamesPlayed;
    if (!winner || !games) {
      return NextResponse.json(
        { error: "Winner and gamesPlayed required to mark final" },
        { status: 400 }
      );
    }
    const higher = d.higherSeed ?? existing.higherSeed;
    const lower = d.lowerSeed ?? existing.lowerSeed;
    if (winner !== higher && winner !== lower) {
      return NextResponse.json({ error: "Winner must be one of the two teams" }, { status: 400 });
    }
  }

  const updated = await prisma.series.update({
    where: { id: params.id },
    data: {
      ...(d.winner !== undefined && { winner: d.winner }),
      ...(d.gamesPlayed !== undefined && { gamesPlayed: d.gamesPlayed }),
      ...(d.isFinal !== undefined && { isFinal: d.isFinal }),
      ...(d.lockAt !== undefined && { lockAt: d.lockAt ? new Date(d.lockAt) : null }),
      ...(d.higherSeed !== undefined && { higherSeed: d.higherSeed }),
      ...(d.higherSeedAbbr !== undefined && { higherSeedAbbr: d.higherSeedAbbr }),
      ...(d.higherSeedNum !== undefined && { higherSeedNum: d.higherSeedNum }),
      ...(d.lowerSeed !== undefined && { lowerSeed: d.lowerSeed }),
      ...(d.lowerSeedAbbr !== undefined && { lowerSeedAbbr: d.lowerSeedAbbr }),
      ...(d.lowerSeedNum !== undefined && { lowerSeedNum: d.lowerSeedNum }),
    },
  });

  // If just finalized, recompute points for all picks and advance bracket
  if (updated.isFinal && updated.winner && updated.gamesPlayed) {
    const picks = await prisma.pick.findMany({ where: { seriesId: updated.id } });
    await prisma.$transaction(
      picks.map((p) =>
        prisma.pick.update({
          where: { id: p.id },
          data: { pointsAwarded: calculatePoints(p, updated) },
        })
      )
    );

    if (updated.parentSeriesId && updated.parentSlot) {
      // Determine abbr + seed num for the winner
      let abbr: string | null = null;
      let seedNum: number | null = null;
      if (updated.winner === updated.higherSeed) {
        abbr = updated.higherSeedAbbr;
        seedNum = updated.higherSeedNum;
      } else if (updated.winner === updated.lowerSeed) {
        abbr = updated.lowerSeedAbbr;
        seedNum = updated.lowerSeedNum;
      }

      const parent = await prisma.series.findUnique({
        where: { id: updated.parentSeriesId },
      });
      if (parent) {
        const data: Record<string, unknown> = {};
        if (updated.parentSlot === "higher") {
          data.higherSeed = updated.winner;
          data.higherSeedAbbr = abbr;
          data.higherSeedNum = seedNum;
        } else {
          data.lowerSeed = updated.winner;
          data.lowerSeedAbbr = abbr;
          data.lowerSeedNum = seedNum;
        }
        await prisma.series.update({ where: { id: parent.id }, data });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
