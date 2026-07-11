const devFallback = process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-in-production';

export const config = {
  get apiPort() { return parseInt(process.env.API_PORT || '4000', 10); },
  get frontendUrl() { return process.env.FRONTEND_URL || 'http://localhost:3000'; },
  jwt: {
    get secret() { return process.env.JWT_SECRET || devFallback; },
    get expiresIn() { return process.env.JWT_EXPIRES_IN || '7d'; },
  },
  database: {
    get url() { return process.env.DATABASE_URL || 'postgresql://localhost:5432/cmsdb'; },
  },
  redis: {
    get url() { return process.env.REDIS_URL || 'redis://localhost:6379'; },
  },
  s3: {
    get bucket() { return process.env.S3_BUCKET || 'codi'; },
    get region() { return process.env.S3_REGION || 'us-east-1'; },
    get endpoint() { return process.env.S3_ENDPOINT || ''; },
  },
  eval: {
    get pythonBin() { return process.env.EVAL_PYTHON_BIN || `${process.env.HOME}/.codi_venv/bin/python3`; },
  },
};
