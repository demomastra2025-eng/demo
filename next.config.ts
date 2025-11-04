import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@mastra/*", "n8n-mcp", "sql.js"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.experiments = {
        ...(config.experiments ?? {}),
        asyncWebAssembly: true,
      };
    }

    return config;
  },
};

export default nextConfig;
