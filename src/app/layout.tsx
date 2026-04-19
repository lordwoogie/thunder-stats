import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Nav from "@/components/Nav";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "C_OKC Dynasty — Playoff Pick'em",
  description: "2026 NBA Playoffs pick'em for the C_OKC Dynasty league.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-court-bg text-slate-100">
        <Providers>
          <Nav session={session} />
          <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-4 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
