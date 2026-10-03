import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors during build - Supabase SDK has type inference issues
    // These don't affect runtime functionality
    ignoreBuildErrors: process.env.CI ? false : true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pexels.com',
      },
    ],
  },
}

export default nextConfig
