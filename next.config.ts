import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  distDir: process.env.PONGO_DIST_DIR ?? ".next",
  outputFileTracingIncludes: {
    "/shared/*/how-it-works": ["./README.md"],
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
