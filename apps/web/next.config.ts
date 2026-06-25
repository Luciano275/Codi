import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@codi/ui', '@codi/auth', '@codi/types'],
  allowedDevOrigins: ['100.108.75.51']
};

export default nextConfig;
