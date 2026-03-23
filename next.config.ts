import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Experimental cache components — allows 'use cache' directive in server
  // components for safe short-lived caching of non-user-specific reads
  // (e.g. org departments list, static labels). Per-user data uses
  // standard server actions without caching.
  experimental: {
    cacheComponents: true,
  },

  // Compress responses
  compress: true,

  // Strict source maps in development only
  productionBrowserSourceMaps: false,
}

export default nextConfig
