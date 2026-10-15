import type { NextConfig } from 'next'
import { withHolo } from '@holo-js/adapter-next/config'

const appImageSource = new URL('/**', process.env.APP_URL || 'http://localhost:3000')

const nextConfig: NextConfig = withHolo({
  output: 'standalone',
  typescript: {ignoreBuildErrors: true},
  // experimental: {
  // serverActions: {bodySizeLimit: '105mb'},
  // workerThreads: false,
  // cpus: 1
  // },
  experimental: {serverActions: {bodySizeLimit: '105mb'}},
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [appImageSource],
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development'
      && ['localhost', '127.0.0.1', '[::1]'].includes(appImageSource.hostname),
  },
  async headers() {
    return [{source: '/fonts/delivery/:path*', headers: [{key: 'Cache-Control', value: 'public, max-age=31536000, immutable'}]}, {source: '/fonts/cormorant-garamond/:file', headers: [{key: 'Cache-Control', value: 'public, max-age=31536000, immutable'}]}]
  },
})

export default nextConfig
