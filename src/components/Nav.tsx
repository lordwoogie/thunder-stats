"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/picks", label: "Picks" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/bracket", label: "Bracket" },
];

export default function Nav({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const user = session?.user as any;

  if (pathname === "/login" || pathname === "/change-password" || !session) return null;

  return (
    <nav className="sticky top-0 z-40 border-b border-court-line bg-court-bg/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/picks" className="flex items-center gap-2">
          <span className="display text-lg font-bold text-accent">C_OKC</span>
          <span className="label text-xs text-slate-400">Playoff Pick'em</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "label rounded-md px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm",
                pathname.startsWith(t.href)
                  ? "bg-accent/20 text-accent"
                  : "text-slate-300 hover:bg-court-alt"
              )}
            >
              {t.label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "label rounded-md px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm",
                pathname.startsWith("/admin")
                  ? "bg-accent/20 text-accent"
                  : "text-slate-300 hover:bg-court-alt"
              )}
            >
              Admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="label rounded-md border border-court-line px-2.5 py-1.5 text-xs text-slate-300 hover:bg-court-alt sm:text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
