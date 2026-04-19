import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  picks: z
    .array(
      z.object({
        seriesId: z.string().min(1),
        pickedWinner: z.string().min(1),
        pickedGames: z.number().int().min(4).max(7),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const seriesIds = parsed.data.picks.map((p) => p.seriesId);
  const seriesList = await prisma.series.findMany({
    where: { id: { in: seriesIds } },
  });
  const seriesMap = new Map(seriesList.map((s) => [s.id, s]));

  const now = Date.now();

  for (const p of parsed.data.picks) {
    const s = seriesMap.get(p.seriesId);
    if (!s) return NextResponse.json({ error: `Series not found: ${p.seriesId}` }, { status: 400 });
    if (s.isFinal) return NextResponse.json({ error: `Series is final: ${s.seriesLabel}` }, { status: 400 });
    if (s.lockAt && new Date(s.lockAt).getTime() <= now) {
      return NextResponse.json({ error: `Series is locked: ${s.seriesLabel}` }, { status: 400 });
    }
    if (!s.higherSeed || !s.lowerSeed) {
      return NextResponse.json(
        { error: `Series matchup not set: ${s.seriesLabel}` },
        { status: 400 }
      );
    }
    if (p.pickedWinner !== s.higherSeed && p.pickedWinner !== s.lowerSeed) {
      return NextResponse.json(
        { error: `Winner must be one of the two teams in ${s.seriesLabel}` },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(
    parsed.data.picks.map((p) =>
      prisma.pick.upsert({
        where: { userId_seriesId: { userId: user.id, seriesId: p.seriesId } },
        update: { pickedWinner: p.pickedWinner, pickedGames: p.pickedGames },
        create: {
          userId: user.id,
          seriesId: p.seriesId,
          pickedWinner: p.pickedWinner,
          pickedGames: p.pickedGames,
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
