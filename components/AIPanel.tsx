"use client";

import { PREBUILT_PROMPTS } from "@/lib/ai-context";
import { useState } from "react";

interface AIResponse {
  text?: string;
  error?: string;
}

export default function AIPanel() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function run(p: string, t?: string) {
    setLoading(true);
    setError("");
    setAnswer("");
    setTitle(t);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p, title: t })
      });
      const data = (await res.json()) as AIResponse;
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setAnswer(data.text ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-5">
      <aside className="card p-4 space-y-3 h-fit">
        <h2 className="font-display text-sm text-brand-blue mb-1">
          Pre-built Prompts
        </h2>
        {Object.entries(PREBUILT_PROMPTS).map(([key, v]) => (
          <button
            key={key}
            onClick={() => run(v.prompt, v.title)}
            disabled={loading}
            className="block w-full text-left px-3 py-2.5 rounded-lg bg-bg-alt hover:bg-bg-alt/70 border border-[rgba(0,122,193,0.2)] hover:border-brand-blue/60 transition-colors disabled:opacity-50"
          >
            <div className="font-cond text-sm font-semibold tracking-wider uppercase">
              {v.title}
            </div>
            <div className="text-xs text-muted line-clamp-2 mt-0.5">
              {v.prompt}
            </div>
          </button>
        ))}
      </aside>

      <section className="space-y-4">
        <div className="card p-4">
          <label className="font-cond text-xs uppercase tracking-wider text-muted block mb-2">
            Ask Anything
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Should I trade Justin Jefferson for Puka Nacua straight up?"
            className="w-full min-h-[110px] bg-bg-alt border border-[rgba(0,122,193,0.25)] rounded-lg p-3 text-ink outline-none focus:border-brand-blue resize-y"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-dim">
              Analysis uses live Sleeper rosters and your 2025 stats context.
            </span>
            <button
              onClick={() => run(prompt)}
              disabled={loading || prompt.trim().length < 4}
              className="btn-primary"
            >
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </div>

        <div className="card p-5 min-h-[320px]">
          {title && (
            <div className="font-cond text-xs uppercase tracking-widest text-brand-orange mb-2">
              {title}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-3 text-muted">
              <span className="w-3 h-3 rounded-full bg-brand-blue animate-pulse" />
              <span className="font-cond uppercase tracking-wider text-sm">
                Running Claude analysis…
              </span>
            </div>
          )}
          {error && (
            <div className="text-red-400 font-cond">
              <div className="uppercase tracking-wider text-sm mb-1">Error</div>
              <div className="text-sm text-red-300">{error}</div>
              {error.includes("ANTHROPIC_API_KEY") && (
                <div className="text-xs text-muted mt-2">
                  Set ANTHROPIC_API_KEY in your .env.local file.
                </div>
              )}
            </div>
          )}
          {!loading && !error && answer && (
            <div className="prose-ai text-ink">{answer}</div>
          )}
          {!loading && !error && !answer && (
            <div className="text-dim text-sm font-cond uppercase tracking-wider">
              Pick a pre-built prompt or ask something above.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
