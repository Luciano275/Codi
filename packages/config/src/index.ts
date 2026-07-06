export const config = {
  apiPort: parseInt(process.env.API_PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/cmsdb',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  s3: {
    bucket: process.env.S3_BUCKET || 'codi',
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || '',
  },
  eval: {
    pythonBin: process.env.EVAL_PYTHON_BIN || `${process.env.HOME}/.codi_venv/bin/python3`,
  },
};
