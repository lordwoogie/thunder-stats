import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isLocked(lockAt: Date | null | undefined): boolean {
  if (!lockAt) return false;
  return new Date(lockAt).getTime() <= Date.now();
}

export function formatLock(lockAt: Date | null | undefined): string {
  if (!lockAt) return "TBD";
  return new Date(lockAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const ROUND_NAMES: Record<number, string> = {
  1: "Round 1",
  2: "Conference Semifinals",
  3: "Conference Finals",
  4: "NBA Finals",
};
