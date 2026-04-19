"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { update } = useSession();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update password.");
      return;
    }
    await update({ mustChangePassword: false });
    router.push("/picks");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="card p-6">
        <h1 className="display text-center text-2xl">Set a new password</h1>
        <p className="label mt-1 text-center text-xs text-slate-400">Required on first login</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="label text-xs text-slate-400">Current password</label>
            <input
              type="password"
              className="input mt-1"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label text-xs text-slate-400">New password</label>
            <input
              type="password"
              className="input mt-1"
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label text-xs text-slate-400">Confirm new password</label>
            <input
              type="password"
              className="input mt-1"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Saving..." : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}
