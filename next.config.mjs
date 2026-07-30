/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sleepercdn.com" }
    ]
  },
  // Standalone single-file apps live in public/ and predate this Next app.
  // These rewrites give them clean extensionless URLs; the original
  // /lottery.html and /thunder.html paths still resolve from public/ too,
  // so existing links keep working.
  async rewrites() {
    return [
      { source: "/lottery", destination: "/lottery.html" },
      { source: "/thunder", destination: "/thunder.html" }
    ];
  }
};

export default nextConfig;
