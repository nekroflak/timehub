import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,

  // Strict source maps in development only
  productionBrowserSourceMaps: false,
}

export default nextConfig
