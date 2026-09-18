/** Configure standalone builds and proxy /api requests to the server. */
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(process.cwd(), '..'),
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://127.0.0.1:8000'}/api/:path*`
      }
    ];
  }
};
export default nextConfig;
