"use client";

import { useMemo, useState } from "react";

export interface TradePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  ppg: number | null;
  rank: number | null;
}

export interface TradePick {
  id: string;
  label: string;
}

export interface TradeTeam {
  roster_id: number;
  team_name: string;
  display_name: string;
  players: TradePlayer[];
  picks: TradePick[];
}

/** A chosen asset, kept as the exact string the API will receive. */
interface Asset {
  key: string;
  label: string;
}

function playerLabel(p: TradePlayer): string {
  const bits = [p.position, p.team].filter(Boolean).join(" · ");
  const rank = p.rank ? ` · #${p.rank}` : "";
  const ppg = p.ppg != null ? ` · ${p.ppg} PPG` : "";
  return `${p.name} (${bits}${rank}${ppg})`;
}

/**
 * Dropdown that appends to a list rather than replacing a value, plus the
 * chosen assets as removable chips. A trade is many-to-many, so a plain
 * <select> can't express it and a multi-select is miserable on a phone.
 */
function AssetPicker({
  label,
  team,
  selected,
  onChange,
  emptyHint
}: {
  label: string;
  team: TradeTeam | null;
  selected: Asset[];
  onChange: (next: Asset[]) => void;
  emptyHint: string;
}) {
  const chosen = useMemo(
    () => new Set(selected.map((a) => a.key)),
    [selected]
  );

  function add(key: string) {
    if (!team || !key) return;
    const player = team.players.find((p) => p.id === key);
    const pick = team.picks.find((p) => p.id === key);
    const asset = player
      ? { key, label: playerLabel(player) }
      : pick
        ? { key, label: pick.label }
        : null;
    if (asset && !chosen.has(key)) onChange([...selected, asset]);
  }

  return (
    <div>
      <label className="font-cond text-xs uppercase tracking-wider text-muted block mb-1.5">
        {label}
      </label>

      <select
        // Always snaps back to the placeholder so the same option can be
        // re-picked after being removed.
        value=""
        onChange={(e) => add(e.target.value)}
        disabled={!team}
        className="w-full bg-bg-alt border border-[rgba(0,122,193,0.25)] rounded-lg p-2.5 outline-none focus:border-brand-blue disabled:opacity-50"
      >
        <option value="">{team ? "+ add player or pick" : emptyHint}</option>
        {team && team.players.length > 0 && (
          <optgroup label="Players">
            {team.players.map((p) => (
              <option key={p.id} value={p.id} disabled={chosen.has(p.id)}>
                {playerLabel(p)}
              </option>
            ))}
          </optgroup>
        )}
        {team && team.picks.length > 0 && (
          <optgroup label="Draft picks">
            {team.picks.map((p) => (
              <option key={p.id} value={p.id} disabled={chosen.has(p.id)}>
                {p.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">
        {selected.length === 0 && (
          <span className="text-dim text-xs font-cond uppercase tracking-wider self-center">
            nothing selected
          </span>
        )}
        {selected.map((a) => (
          <button
            key={a.key}
            onClick={() => onChange(selected.filter((x) => x.key !== a.key))}
            className="group flex items-center gap-1.5 text-xs bg-bg-alt border border-[rgba(0,122,193,0.35)] hover:border-red-400/70 rounded-full pl-2.5 pr-2 py-1 transition-colors"
            title="Remove"
          >
            <span>{a.label}</span>
            <span className="text-dim group-hover:text-red-400">×</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TradeForm({
  teams,
  myRosterId,
  loadError
}: {
  teams: TradeTeam[];
  myRosterId: number;
  loadError: string | null;
}) {
  const [theirRosterId, setTheirRosterId] = useState<number | null>(null);
  const [mySide, setMySide] = useState<Asset[]>([]);
  const [theirSide, setTheirSide] = useState<Asset[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const myTeam = teams.find((t) => t.roster_id === myRosterId) ?? null;
  const theirTeam = teams.find((t) => t.roster_id === theirRosterId) ?? null;

  function pickCounterparty(rosterId: number | null) {
    setTheirRosterId(rosterId);
    // Their assets belong to the old counterparty; keep my side intact.
    setTheirSide([]);
  }

  async function submit() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/trade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          my_side: mySide.map((a) => a.label).join(", "),
          their_side: theirSide.map((a) => a.label).join(", "),
          their_team: theirTeam
            ? `${theirTeam.team_name} (${theirTeam.display_name})`
            : undefined,
          notes: notes || undefined
        })
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) setError(data.error ?? `HTTP ${res.status}`);
      else setResult(data.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="card p-5 text-red-400 text-sm">
        <div className="font-cond uppercase tracking-wider mb-1">
          Could not load rosters
        </div>
        {loadError}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <section className="card p-5 space-y-4">
        <div>
          <label className="font-cond text-xs uppercase tracking-wider text-muted block mb-1.5">
            Trade with
          </label>
          <select
            value={theirRosterId ?? ""}
            onChange={(e) =>
              pickCounterparty(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full bg-bg-alt border border-[rgba(0,122,193,0.25)] rounded-lg p-2.5 outline-none focus:border-brand-blue"
          >
            <option value="">— choose a team —</option>
            {teams
              .filter((t) => t.roster_id !== myRosterId)
              .map((t) => (
                <option key={t.roster_id} value={t.roster_id}>
                  {t.team_name} · {t.display_name}
                </option>
              ))}
          </select>
        </div>

        <AssetPicker
          label="I send"
          team={myTeam}
          selected={mySide}
          onChange={setMySide}
          emptyHint="roster unavailable"
        />

        <AssetPicker
          label="I receive"
          team={theirTeam}
          selected={theirSide}
          onChange={setTheirSide}
          emptyHint="pick a team first"
        />

        <div>
          <label className="font-cond text-xs uppercase tracking-wider text-muted block mb-1.5">
            Notes (optional)
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. I need win-now RB help"
            className="w-full bg-bg-alt border border-[rgba(0,122,193,0.25)] rounded-lg p-2.5 outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              setMySide([]);
              setTheirSide([]);
            }}
            disabled={loading || (!mySide.length && !theirSide.length)}
            className="text-xs font-cond uppercase tracking-wider text-dim hover:text-muted disabled:opacity-40"
          >
            Clear
          </button>
          <button
            onClick={submit}
            disabled={loading || !mySide.length || !theirSide.length}
            className="btn-primary"
          >
            {loading ? "Evaluating…" : "Evaluate Trade"}
          </button>
        </div>
      </section>

      <section className="card p-5 min-h-[360px]">
        <h2 className="font-display text-lg text-brand-orange mb-3">
          AI Verdict
        </h2>
        {loading && (
          <div className="text-muted font-cond uppercase tracking-wider text-sm">
            Asking Claude…
          </div>
        )}
        {error && (
          <div className="text-red-400 text-sm">
            <div className="font-cond uppercase tracking-wider mb-1">Error</div>
            {error}
          </div>
        )}
        {!loading && !error && !result && (
          <div className="text-dim text-sm font-cond uppercase tracking-wider">
            Pick a team, choose both sides, then hit Evaluate.
          </div>
        )}
        {!loading && !error && result && (
          <div className="prose-ai text-ink">{result}</div>
        )}
      </section>
    </div>
  );
}
