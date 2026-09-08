const devFallback = process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-in-production';

export const config = {
  get apiPort() {
    return parseInt(process.env.API_PORT || '4000', 10);
  },
  get frontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  },
  jwt: {
    get secret() {
      return process.env.JWT_SECRET || devFallback;
    },
    get expiresIn() {
      return process.env.JWT_EXPIRES_IN || '7d';
    },
  },
  database: {
    get url() {
      return process.env.DATABASE_URL;
    },
  },
  aws: {
    get bucket() {
      return process.env.AWS_BUCKET_NAME;
    },
    get region() {
      return process.env.AWS_REGION;
    },
    get accessKey() {
      return process.env.AWS_ACCESS_KEY;
    },
    get secretKey() {
      return process.env.AWS_SECRET_KEY;
    },
    get endpoint() {
      return process.env.S3_ENDPOINT;
    },
    get signedReadExpiresIn() {
      return parseInt(process.env.S3_SIGNED_READ_EXPIRES_IN || '86400', 10);
    },
  },
  eval: {
    get isolateBin() {
      return process.env.EVAL_ISOLATE_BIN || '/usr/local/bin/isolate';
    },
    get firstBoxId() {
      return parseInt(process.env.EVAL_FIRST_BOX_ID || '200', 10);
    },
    get lastBoxId() {
      return parseInt(process.env.EVAL_LAST_BOX_ID || '299', 10);
    },
    get submissionConcurrency() {
      return parseInt(process.env.EVAL_SUBMISSION_CONCURRENCY || '2', 10);
    },
    get testcaseConcurrency() {
      return parseInt(process.env.EVAL_TESTCASE_CONCURRENCY || '4', 10);
    },
    get compileConcurrency() {
      return parseInt(process.env.EVAL_COMPILE_CONCURRENCY || '1', 10);
    },
    get cacheTtlMs() {
      return parseInt(process.env.EVAL_CACHE_TTL_MS || '300000', 10);
    },
    get queuePollMs() {
      return parseInt(process.env.EVAL_QUEUE_POLL_MS || '250', 10);
    },
    get leaseSeconds() {
      return parseInt(process.env.EVAL_LEASE_SECONDS || '600', 10);
    },
    get maxAttempts() {
      return parseInt(process.env.EVAL_MAX_ATTEMPTS || '3', 10);
    },
    get maxOutputKb() {
      return parseInt(process.env.EVAL_MAX_OUTPUT_KB || '102400', 10);
    },
    get playgroundFirstBoxId() {
      return parseInt(process.env.PLAYGROUND_FIRST_BOX_ID || '300', 10);
    },
    get playgroundLastBoxId() {
      return parseInt(process.env.PLAYGROUND_LAST_BOX_ID || '399', 10);
    },
  },
  redis: {
    get host() {
      return process.env.REDIS_HOST || 'localhost';
    },
    get port() {
      return parseInt(process.env.REDIS_PORT || '6379', 10);
    },
    get user() {
      return process.env.REDIS_USER || '';
    },
    get password() {
      return process.env.REDIS_PASSWORD || '';
    },
  },
};
