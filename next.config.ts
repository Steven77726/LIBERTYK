import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: githubPages ? "/LIBERTYK" : "",
  assetPrefix: githubPages ? "/LIBERTYK/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
