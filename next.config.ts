import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  env: {
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
