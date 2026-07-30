import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@crosscode/shared"],
  output: "standalone",
};

export default nextConfig;
