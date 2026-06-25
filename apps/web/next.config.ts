import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@codi/ui', '@codi/auth', '@codi/types'],
};

export default nextConfig;
