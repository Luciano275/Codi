import { config as dotenv } from 'dotenv';
import { resolve } from 'path';
import type { NextConfig } from 'next';

const rootEnvironment: Record<string, string> = {};
dotenv({ path: resolve(__dirname, '../../.env'), processEnv: rootEnvironment });

for (const name of ['API_URL', 'JWT_EXPIRES_IN', 'S3_ENDPOINT'] as const) {
  process.env[name] ??= rootEnvironment[name];
}

function getS3RemotePattern(): {
  protocol: 'http' | 'https';
  hostname: string;
  port: string;
  pathname: string;
} | null {
  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) return null;

  try {
    const url = new URL(endpoint);
    return {
      protocol: url.protocol === 'http:' ? 'http' : 'https',
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const s3RemotePattern = getS3RemotePattern();

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@codi/ui', '@codi/auth', '@codi/types'],
  allowedDevOrigins: ['100.108.75.51'],
  async headers() {
    return [
      {
        source: '/icons/sprite.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      ...(s3RemotePattern ? [s3RemotePattern] : []),
      { protocol: 'https', hostname: '**.amazonaws.com', pathname: '/**' },
    ],
    localPatterns: [
      { pathname: '/**', search: '' },
      { pathname: '/logo.png', search: '?v=3' },
    ],
  },
};

export default nextConfig;
