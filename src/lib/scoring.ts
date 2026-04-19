import type { Pick, Series } from "@prisma/client";

export function calculatePoints(pick: Pick, series: Series): number {
  if (!series.isFinal || !series.winner || !series.gamesPlayed) return 0;
  if (pick.pickedWinner !== series.winner) return 0;
  const diff = Math.abs(pick.pickedGames - series.gamesPlayed);
  if (diff === 0) return 3;
  if (diff === 1) return 2;
  return 1;
}
