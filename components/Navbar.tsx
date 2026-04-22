"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/stats", label: "Stats" },
  { href: "/ai", label: "AI Analysis" },
  { href: "/league", label: "League Intel" },
  { href: "/trade", label: "Trade Analyzer" }
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-8 py-4 border-b border-[rgba(0,122,193,0.15)] bg-gradient-to-b from-[rgba(0,45,98,0.45)] to-transparent">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-display text-2xl font-bold bg-gradient-to-br from-brand-blue to-brand-orange bg-clip-text text-transparent">
            The Octogon
          </span>
          <span className="font-cond text-xs text-muted tracking-[0.3em] uppercase hidden md:inline">
            Dynasty Analyzer
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 md:gap-2">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 md:px-4 py-2 rounded-lg font-cond text-sm uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-brand-blue/20 text-white border border-brand-blue/50"
                    : "text-muted hover:text-white hover:bg-bg-alt border border-transparent"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="brand-bar h-[2px] opacity-60" />
    </header>
  );
}
