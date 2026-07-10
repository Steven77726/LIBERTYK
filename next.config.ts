import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
};

if (process.env.GITHUB_PAGES === "true") {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/LIBERTYK";

  nextConfig.output = "export";
  nextConfig.basePath = basePath;
  nextConfig.assetPrefix = `${basePath}/`;
  nextConfig.trailingSlash = true;
  nextConfig.images = { unoptimized: true };
}

export default nextConfig;
