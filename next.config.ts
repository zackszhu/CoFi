import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Optimize for Docker deployments
    serverMinification: true,
  },
};

export default nextConfig;
