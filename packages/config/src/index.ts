export const config = {
  apiPort: parseInt(process.env.API_PORT || '4000', 10),
  cmsAdapterPort: parseInt(process.env.CMS_ADAPTER_PORT || '4001'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  cms: {
    apiUrl: process.env.CMS_API_URL || 'http://localhost:8888',
    adminToken: process.env.CMS_ADMIN_TOKEN || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/codi',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  s3: {
    bucket: process.env.S3_BUCKET || 'codi',
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || '',
  },
};
