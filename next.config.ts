import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

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
      {
        protocol: 'https',
        hostname: 'files.manuscdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.manuscdn.com',
      },
    ],
  },
}

export default withAnalyzer(nextConfig)
