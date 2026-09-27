import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.OUTPUT_STANDALONE === "true" || process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
};

export default nextConfig;
