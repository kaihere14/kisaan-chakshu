import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async rewrites() {
    const server = (process.env.API_SERVER_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${server}/api/:path*` }];
  },
};

export default nextConfig;
