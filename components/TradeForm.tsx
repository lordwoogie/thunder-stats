"use client";

import { LEAGUE_MEMBERS } from "@/lib/constants";
import { useState } from "react";

export default function TradeForm() {
  const [mySide, setMySide] = useState("");
  const [theirSide, setTheirSide] = useState("");
  const [theirTeam, setTheirTeam] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/trade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          my_side: mySide,
          their_side: theirSide,
          their_team: theirTeam || undefined,
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

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <section className="card p-5 space-y-3">
        <div>
          <label className="font-cond text-xs uppercase tracking-wider text-muted block mb-1.5">
            I send
          </label>
          <textarea
            value={mySide}
            onChange={(e) => setMySide(e.target.value)}
            placeholder="e.g. Malik Nabers, 2026 1st"
            className="w-full min-h-[80px] bg-bg-alt border border-[rgba(0,122,193,0.25)] rounded-lg p-3 outline-none focus:border-brand-blue resize-y"
          />
        </div>

        <div>
          <label className="font-cond text-xs uppercase tracking-wider text-muted block mb-1.5">
            I receive
          </label>
          <textarea
            value={theirSide}
            onChange={(e) => setTheirSide(e.target.value)}
            placeholder="e.g. Christian McCaffrey, Isaac Guerendo, 2027 1st"
            className="w-full min-h-[80px] bg-bg-alt border border-[rgba(0,122,193,0.25)] rounded-lg p-3 outline-none focus:border-brand-blue resize-y"
          />
        </div>

        <div>
          <label className="font-cond text-xs uppercase tracking-wider text-muted block mb-1.5">
            Counterparty (optional)
          </label>
          <select
            value={theirTeam}
            onChange={(e) => setTheirTeam(e.target.value)}
            className="w-full bg-bg-alt border border-[rgba(0,122,193,0.25)] rounded-lg p-2.5 outline-none focus:border-brand-blue"
          >
            <option value="">— choose a team —</option>
            {LEAGUE_MEMBERS.filter((m) => m.roster_id !== 1).map((m) => (
              <option key={m.roster_id} value={`${m.team_name} (${m.display_name})`}>
                {m.team_name} · {m.display_name}
              </option>
            ))}
          </select>
        </div>

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

        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={loading || !mySide.trim() || !theirSide.trim()}
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
            Fill in both sides of the trade and hit Evaluate.
          </div>
        )}
        {!loading && !error && result && (
          <div className="prose-ai text-ink">{result}</div>
        )}
      </section>
    </div>
  );
}
