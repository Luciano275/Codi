const devFallback = process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-in-production';

export const config = {
  get apiPort() { return parseInt(process.env.API_PORT || '4000', 10); },
  get frontendUrl() { return process.env.FRONTEND_URL || 'http://localhost:3000'; },
  jwt: {
    get secret() { return process.env.JWT_SECRET || devFallback; },
    get expiresIn() { return process.env.JWT_EXPIRES_IN || '7d'; },
  },
  database: {
    get url() { return process.env.DATABASE_URL; },
  },
  aws: {
    get bucket() { return process.env.AWS_BUCKET_NAME; },
    get region() { return process.env.AWS_REGION; },
    get access_key() { return process.env.AWS_ACCESS_KEY; },
    get secret_key() { return process.env.AWS_SECRET_KEY; }
  },
  eval: {
    get pythonBin() { return process.env.EVAL_PYTHON_BIN || `${process.env.HOME}/.codi_venv/bin/python3`; },
  },
  redis: {
    get host() { return process.env.REDIS_HOST || 'localhost'; },
    get port() { return parseInt(process.env.REDIS_PORT || '6379', 10); },
    get user() { return process.env.REDIS_USER || ''; },
    get password() { return process.env.REDIS_PASSWORD || ''; },
  }
};
