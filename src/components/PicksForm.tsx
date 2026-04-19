"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn, formatLock, isLocked, ROUND_NAMES } from "@/lib/utils";
import { logoUrl } from "@/lib/teams";

type SeriesLite = {
  id: string;
  slot: string;
  round: number;
  conference: string | null;
  seriesLabel: string;
  higherSeed: string | null;
  higherSeedAbbr: string | null;
  higherSeedNum: number | null;
  lowerSeed: string | null;
  lowerSeedAbbr: string | null;
  lowerSeedNum: number | null;
  lockAt: string | null;
  winner: string | null;
  gamesPlayed: number | null;
  isFinal: boolean;
};

type PickLite = {
  seriesId: string;
  pickedWinner: string;
  pickedGames: number;
  pointsAwarded: number | null;
};

type DraftPick = { pickedWinner: string; pickedGames: number };

export default function PicksForm({
  series,
  picks,
}: {
  series: SeriesLite[];
  picks: PickLite[];
}) {
  const existing = useMemo(() => {
    const map = new Map<string, DraftPick>();
    for (const p of picks) map.set(p.seriesId, { pickedWinner: p.pickedWinner, pickedGames: p.pickedGames });
    return map;
  }, [picks]);

  const [draft, setDraft] = useState<Map<string, DraftPick>>(new Map(existing));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState<number>(1);

  const grouped = useMemo(() => {
    const g: Record<number, SeriesLite[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const s of series) g[s.round]?.push(s);
    return g;
  }, [series]);

  function updateDraft(seriesId: string, patch: Partial<DraftPick>) {
    setDraft((prev) => {
      const next = new Map(prev);
      const cur = next.get(seriesId) || { pickedWinner: "", pickedGames: 0 };
      next.set(seriesId, { ...cur, ...patch });
      return next;
    });
  }

  const pickMap = useMemo(() => {
    const m = new Map<string, PickLite>();
    for (const p of picks) m.set(p.seriesId, p);
    return m;
  }, [picks]);

  function changedSeries(): { seriesId: string; pickedWinner: string; pickedGames: number }[] {
    const out: { seriesId: string; pickedWinner: string; pickedGames: number }[] = [];
    for (const [seriesId, d] of draft.entries()) {
      if (!d.pickedWinner || !d.pickedGames) continue;
      const ex = existing.get(seriesId);
      if (!ex || ex.pickedWinner !== d.pickedWinner || ex.pickedGames !== d.pickedGames) {
        out.push({ seriesId, ...d });
      }
    }
    return out;
  }

  async function onSave() {
    const payload = changedSeries();
    if (payload.length === 0) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks: payload }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save picks.");
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
    // Merge into existing
    for (const p of payload) {
      existing.set(p.seriesId, { pickedWinner: p.pickedWinner, pickedGames: p.pickedGames });
    }
  }

  const unsaved = changedSeries().length;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((r) => (
          <button
            key={r}
            onClick={() => setActiveRound(r)}
            className={cn(
              "label rounded-md px-3 py-1.5 text-xs transition",
              activeRound === r
                ? "bg-accent text-black"
                : "border border-court-line text-slate-300 hover:bg-court-alt"
            )}
          >
            {ROUND_NAMES[r]}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {grouped[activeRound]?.length === 0 && (
          <div className="card p-6 text-center text-slate-400">
            This round will unlock as earlier rounds complete.
          </div>
        )}
        {grouped[activeRound]?.map((s) => (
          <SeriesCard
            key={s.id}
            series={s}
            draft={draft.get(s.id)}
            locked={isLocked(s.lockAt ? new Date(s.lockAt) : null)}
            savedPick={pickMap.get(s.id) || null}
            onChange={(patch) => updateDraft(s.id, patch)}
          />
        ))}
      </div>

      <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-3 rounded-xl border border-court-line bg-court-card/95 p-3 backdrop-blur">
        <div className="text-xs text-slate-400">
          {unsaved > 0 ? (
            <span className="text-accent">{unsaved} unsaved change{unsaved === 1 ? "" : "s"}</span>
          ) : savedAt ? (
            <span>Saved at {savedAt}</span>
          ) : (
            <span>No changes</span>
          )}
          {error && <div className="text-red-400">{error}</div>}
        </div>
        <button className="btn-primary" onClick={onSave} disabled={unsaved === 0 || saving}>
          {saving ? "Saving..." : "Save picks"}
        </button>
      </div>
    </div>
  );
}

function SeriesCard({
  series,
  draft,
  locked,
  savedPick,
  onChange,
}: {
  series: SeriesLite;
  draft: DraftPick | undefined;
  locked: boolean;
  savedPick: PickLite | null;
  onChange: (patch: Partial<DraftPick>) => void;
}) {
  const ready = !!series.higherSeed && !!series.lowerSeed;
  const pickedWinner = draft?.pickedWinner ?? savedPick?.pickedWinner ?? "";
  const pickedGames = draft?.pickedGames ?? savedPick?.pickedGames ?? 0;

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="label text-xs text-slate-400">{series.seriesLabel}</div>
          {!series.isFinal && series.lockAt && (
            <div className="mt-0.5 text-[11px] text-slate-500">
              Locks {formatLock(new Date(series.lockAt))}
            </div>
          )}
        </div>
        <div>
          {series.isFinal ? (
            <span className="chip-final">Final</span>
          ) : locked ? (
            <span className="chip-locked">Locked</span>
          ) : ready ? (
            <span className="chip-live">Open</span>
          ) : (
            <span className="chip">TBD</span>
          )}
        </div>
      </div>

      {!ready ? (
        <p className="mt-3 text-sm text-slate-500">Matchup set once earlier round completes.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <TeamButton
              active={pickedWinner === series.higherSeed}
              disabled={locked || series.isFinal}
              name={series.higherSeed!}
              abbr={series.higherSeedAbbr!}
              seedNum={series.higherSeedNum ?? undefined}
              onClick={() => onChange({ pickedWinner: series.higherSeed! })}
            />
            <TeamButton
              active={pickedWinner === series.lowerSeed}
              disabled={locked || series.isFinal}
              name={series.lowerSeed!}
              abbr={series.lowerSeedAbbr!}
              seedNum={series.lowerSeedNum ?? undefined}
              onClick={() => onChange({ pickedWinner: series.lowerSeed! })}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="label text-xs text-slate-400">Games to win in</div>
            <div className="flex gap-2">
              {[4, 5, 6, 7].map((g) => (
                <button
                  key={g}
                  disabled={locked || series.isFinal}
                  onClick={() => onChange({ pickedGames: g })}
                  className={cn(
                    "h-9 w-9 rounded-lg border text-sm font-semibold transition",
                    pickedGames === g
                      ? "border-accent bg-accent text-black"
                      : "border-court-line bg-court-bg text-slate-300 hover:bg-court-alt",
                    (locked || series.isFinal) && "opacity-50"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {series.isFinal && series.winner && (
            <div className="mt-4 rounded-lg border border-court-line bg-court-bg px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Result</span>
                <span className="font-semibold text-emerald-300">
                  {series.winner} in {series.gamesPlayed}
                </span>
              </div>
              {savedPick && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-400">Your pick</span>
                  <span>
                    {savedPick.pickedWinner} in {savedPick.pickedGames}{" "}
                    <span
                      className={cn(
                        "ml-1 rounded px-1.5 py-0.5 text-xs font-bold",
                        (savedPick.pointsAwarded ?? 0) >= 3
                          ? "bg-emerald-500/20 text-emerald-300"
                          : (savedPick.pointsAwarded ?? 0) > 0
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                      )}
                    >
                      {savedPick.pointsAwarded ?? 0} pt{(savedPick.pointsAwarded ?? 0) === 1 ? "" : "s"}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeamButton({
  active,
  disabled,
  name,
  abbr,
  seedNum,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  name: string;
  abbr: string;
  seedNum?: number;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 text-left transition",
        active
          ? "border-accent bg-accent/10 shadow-glow"
          : "border-court-line bg-court-bg hover:bg-court-alt",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl(abbr)} alt={abbr} className="h-10 w-10 shrink-0" />
      <div>
        {seedNum && <div className="label text-[10px] text-slate-400">#{seedNum}</div>}
        <div className="text-sm font-semibold leading-tight">{name}</div>
      </div>
    </button>
  );
}
