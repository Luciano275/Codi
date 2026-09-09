import { config as dotenv } from 'dotenv';
import { resolve } from 'path';
import type { NextConfig } from 'next';

dotenv({ path: resolve(__dirname, '../../.env') });

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@codi/ui', '@codi/auth', '@codi/types'],
  allowedDevOrigins: ['100.108.75.51'],
  images: {
    localPatterns: [
      { pathname: '/**', search: '' },
      { pathname: '/logo.png', search: '?v=3' },
    ],
  },
};

export default nextConfig;
