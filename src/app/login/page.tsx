"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      username: username.toLowerCase().trim(),
      password,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid username or password.");
      return;
    }
    const callback = search.get("callbackUrl") || "/picks";
    router.push(callback);
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="card p-6">
        <h1 className="display text-center text-2xl">
          <span className="text-accent">C_OKC</span> Dynasty
        </h1>
        <p className="label mt-1 text-center text-xs text-slate-400">2026 Playoff Pick'em</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="label text-xs text-slate-400">Username</label>
            <input
              className="input mt-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label text-xs text-slate-400">Password</label>
            <input
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        Forgot your password? Ask the commish.
      </p>
    </div>
  );
}
