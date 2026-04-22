import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "The Octogon — Dynasty Analyzer",
  description:
    "Sleeper dynasty league analyzer for Lord Woogie and The Octogon.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6">
            {children}
          </main>
          <footer className="text-xs text-dim text-center py-6 border-t border-[rgba(0,122,193,0.1)]">
            Data via Sleeper API · AI via Anthropic Claude · Built for LordWoogie
          </footer>
        </div>
      </body>
    </html>
  );
}
