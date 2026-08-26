import type { NextConfig } from "next";

// Gated behind an env var (set by the electron:build/electron:dev scripts)
// rather than applied unconditionally like Nameology's own next.config.ts --
// `output: "export"` makes `next start` fail outright ("next start does not
// work with output: export"), which would silently break this project's own
// documented `npm run start` prod-preview workflow. Keeping it opt-in
// preserves that workflow for normal web development while still allowing
// the Electron build to produce the static `out/` directory it needs.
const isElectronBuild = process.env.ELECTRON_BUILD === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isElectronBuild ? { output: "export" as const, trailingSlash: true } : {}),
};

export default nextConfig;
