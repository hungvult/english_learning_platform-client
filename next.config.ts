import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        // FastAPI static file server (Browser)
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/static/**",
      },
      {
        // FastAPI static file server (Internal Docker SSR)
        protocol: "http",
        hostname: "backend",
        port: "8000",
        pathname: "/static/**",
      },
    ],
  },
};

export default nextConfig;
