import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly — otherwise Turbopack's lockfile-based
  // inference can get confused by an unrelated lockfile elsewhere on disk
  // (outside this repo entirely) and misidentify the monorepo root.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
