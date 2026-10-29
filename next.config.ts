import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Playwright's webServer to run beside a local `next dev` without sharing the lock.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@libsql/client"],
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
