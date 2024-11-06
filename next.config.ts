import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    ODDSBLAZE_API_KEY: process.env.ODDSBLAZE_API_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SUPABASE_PUBLIC_URL: process.env.SUPABASE_PUBLIC_URL,
    SUPABASE_PUBLIC_ANON_KEY: process.env.SUPABASE_PUBLIC_ANON_KEY,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  },
};

export default nextConfig;
