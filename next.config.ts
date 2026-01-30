import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: "dist",
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "./tsconfig.json",
  },
  // Turbopack 配置
  turbopack: {
    // 服务器外部模块 - bun:sqlite 只在 Bun 运行时可用
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
