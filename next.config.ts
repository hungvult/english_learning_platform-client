import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // FastAPI static file server
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/static/**",
      },
    ],
  },
};

export default nextConfig;
