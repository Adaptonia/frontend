import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "supersecret-nextauth-development-key",
  },
  images: {
    domains: ['cloud.appwrite.io'],
  },
};

export default nextConfig;
