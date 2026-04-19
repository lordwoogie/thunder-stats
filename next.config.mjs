/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.nba.com" },
      { protocol: "https", hostname: "a.espncdn.com" },
    ],
  },
};

export default nextConfig;
