"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, ROUND_NAMES, formatLock, isLocked } from "@/lib/utils";

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

type UserLite = {
  id: string;
  username: string;
  teamName: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
};

export default function AdminDashboard({
  series,
  users,
}: {
  series: SeriesLite[];
  users: UserLite[];
}) {
  const [tab, setTab] = useState<"results" | "series" | "users">("results");

  return (
    <div className="mt-2">
      <header>
        <h1 className="display text-2xl sm:text-3xl">
          Commish <span className="text-accent">Console</span>
        </h1>
        <p className="label text-xs text-slate-400">League admin tools</p>
      </header>

      <div className="mt-4 flex gap-2">
        {[
          { k: "results", label: "Enter results" },
          { k: "series", label: "Series" },
          { k: "users", label: "Users" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={cn(
              "label rounded-md px-3 py-1.5 text-xs transition",
              tab === t.k
                ? "bg-accent text-black"
                : "border border-court-line text-slate-300 hover:bg-court-alt"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "results" && <ResultsPanel series={series} />}
        {tab === "series" && <SeriesPanel series={series} />}
        {tab === "users" && <UsersPanel users={users} />}
      </div>
    </div>
  );
}

function ResultsPanel({ series }: { series: SeriesLite[] }) {
  const router = useRouter();
  const open = series.filter((s) => s.higherSeed && s.lowerSeed);

  return (
    <div className="space-y-3">
      {open.map((s) => (
        <ResultCard key={s.id} s={s} onUpdated={() => router.refresh()} />
      ))}
    </div>
  );
}

function ResultCard({ s, onUpdated }: { s: SeriesLite; onUpdated: () => void }) {
  const [winner, setWinner] = useState(s.winner || "");
  const [games, setGames] = useState<number>(s.gamesPlayed || 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(finalFlag: boolean) {
    setSaving(true);
    setErr(null);
    const res = await fetch(`/api/admin/series/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        winner: winner || null,
        gamesPlayed: games || null,
        isFinal: finalFlag,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Failed to save.");
      return;
    }
    onUpdated();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="label text-[10px] text-slate-500">{ROUND_NAMES[s.round]}</div>
          <div className="font-semibold">{s.seriesLabel}</div>
          <div className="text-xs text-slate-500">
            {s.higherSeed} vs {s.lowerSeed}
          </div>
        </div>
        {s.isFinal && <span className="chip-final">Final</span>}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select
          className="select"
          value={winner}
          onChange={(e) => setWinner(e.target.value)}
          disabled={!s.higherSeed || !s.lowerSeed}
        >
          <option value="">Pick winner…</option>
          {s.higherSeed && <option value={s.higherSeed}>{s.higherSeed}</option>}
          {s.lowerSeed && <option value={s.lowerSeed}>{s.lowerSeed}</option>}
        </select>
        <select
          className="select"
          value={games || ""}
          onChange={(e) => setGames(Number(e.target.value) || 0)}
        >
          <option value="">Games…</option>
          {[4, 5, 6, 7].map((g) => (
            <option key={g} value={g}>
              in {g}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            className="btn-ghost w-full"
            onClick={() => save(false)}
            disabled={saving}
          >
            Save
          </button>
          <button
            className="btn-primary w-full"
            onClick={() => save(true)}
            disabled={saving || !winner || !games}
          >
            Mark final
          </button>
        </div>
      </div>
      {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
    </div>
  );
}

function SeriesPanel({ series }: { series: SeriesLite[] }) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      {series.map((s) => (
        <SeriesEditCard key={s.id} s={s} onUpdated={() => router.refresh()} />
      ))}
    </div>
  );
}

function SeriesEditCard({ s, onUpdated }: { s: SeriesLite; onUpdated: () => void }) {
  const [lockAt, setLockAt] = useState<string>(
    s.lockAt ? new Date(s.lockAt).toISOString().slice(0, 16) : ""
  );
  const [higher, setHigher] = useState(s.higherSeed || "");
  const [higherAbbr, setHigherAbbr] = useState(s.higherSeedAbbr || "");
  const [higherNum, setHigherNum] = useState<number | "">(s.higherSeedNum ?? "");
  const [lower, setLower] = useState(s.lowerSeed || "");
  const [lowerAbbr, setLowerAbbr] = useState(s.lowerSeedAbbr || "");
  const [lowerNum, setLowerNum] = useState<number | "">(s.lowerSeedNum ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    const res = await fetch(`/api/admin/series/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lockAt: lockAt ? new Date(lockAt).toISOString() : null,
        higherSeed: higher || null,
        higherSeedAbbr: higherAbbr || null,
        higherSeedNum: higherNum === "" ? null : Number(higherNum),
        lowerSeed: lower || null,
        lowerSeedAbbr: lowerAbbr || null,
        lowerSeedNum: lowerNum === "" ? null : Number(lowerNum),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Failed to save.");
      return;
    }
    onUpdated();
  }

  const locked = isLocked(s.lockAt ? new Date(s.lockAt) : null);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="label text-[10px] text-slate-500">{ROUND_NAMES[s.round]}</div>
          <div className="font-semibold">{s.seriesLabel}</div>
          <div className="text-xs text-slate-500">
            Lock: {formatLock(s.lockAt ? new Date(s.lockAt) : null)}{" "}
            {locked && <span className="chip-locked ml-1">Locked</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="label text-[10px] text-slate-400">Higher seed name</span>
          <input className="input" value={higher} onChange={(e) => setHigher(e.target.value)} />
        </label>
        <label className="block">
          <span className="label text-[10px] text-slate-400">Lower seed name</span>
          <input className="input" value={lower} onChange={(e) => setLower(e.target.value)} />
        </label>
        <label className="block">
          <span className="label text-[10px] text-slate-400">Higher abbr / seed #</span>
          <div className="flex gap-2">
            <input
              className="input"
              value={higherAbbr}
              onChange={(e) => setHigherAbbr(e.target.value.toUpperCase())}
              maxLength={3}
            />
            <input
              className="input w-20"
              type="number"
              value={higherNum}
              onChange={(e) => setHigherNum(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </label>
        <label className="block">
          <span className="label text-[10px] text-slate-400">Lower abbr / seed #</span>
          <div className="flex gap-2">
            <input
              className="input"
              value={lowerAbbr}
              onChange={(e) => setLowerAbbr(e.target.value.toUpperCase())}
              maxLength={3}
            />
            <input
              className="input w-20"
              type="number"
              value={lowerNum}
              onChange={(e) => setLowerNum(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </label>
        <label className="block sm:col-span-2">
          <span className="label text-[10px] text-slate-400">Lock time (local)</span>
          <input
            className="input"
            type="datetime-local"
            value={lockAt}
            onChange={(e) => setLockAt(e.target.value)}
          />
        </label>
      </div>
      {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      <div className="mt-3 flex justify-end">
        <button className="btn-primary" onClick={save} disabled={saving}>
          Save series
        </button>
      </div>
    </div>
  );
}

function UsersPanel({ users }: { users: UserLite[] }) {
  const router = useRouter();
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-court-alt/70 text-left">
          <tr className="label text-xs text-slate-400">
            <th className="px-3 py-3">Team</th>
            <th className="px-3 py-3">User</th>
            <th className="px-3 py-3">Admin</th>
            <th className="px-3 py-3">Pw reset?</th>
            <th className="px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} u={u} onUpdated={() => router.refresh()} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ u, onUpdated }: { u: UserLite; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false);

  async function post(body: any) {
    setBusy(true);
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    onUpdated();
  }

  async function resetPassword() {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${u.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (data.tempPassword) {
      alert(`Temp password for ${u.username}:\n\n${data.tempPassword}\n\nShare with user.`);
    }
    onUpdated();
  }

  return (
    <tr className="border-t border-court-line">
      <td className="px-3 py-3 font-semibold">{u.teamName}</td>
      <td className="px-3 py-3 text-slate-400">@{u.username}</td>
      <td className="px-3 py-3">{u.isAdmin ? "Yes" : "No"}</td>
      <td className="px-3 py-3">{u.mustChangePassword ? "Pending" : "Done"}</td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-2">
          <button
            className="btn-ghost text-xs"
            onClick={() => post({ isAdmin: !u.isAdmin })}
            disabled={busy}
          >
            {u.isAdmin ? "Revoke admin" : "Make admin"}
          </button>
          <button className="btn-ghost text-xs" onClick={resetPassword} disabled={busy}>
            Reset password
          </button>
        </div>
      </td>
    </tr>
  );
}
