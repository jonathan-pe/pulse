import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SUPABASE_PUBLIC_URL: process.env.SUPABASE_PUBLIC_URL,
    SUPABASE_PUBLIC_ANON_KEY: process.env.SUPABASE_PUBLIC_ANON_KEY,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    BACKEND_URL: process.env.BACKEND_URL,
    HCAPTCHA_SITE_KEY: process.env.HCAPTCHA_SITE_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
