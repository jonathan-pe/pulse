import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    BACKEND_URL: process.env.BACKEND_URL,
    HCAPTCHA_SITE_KEY: process.env.HCAPTCHA_SITE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
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
