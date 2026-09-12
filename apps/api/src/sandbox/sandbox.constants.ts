export const sandboxSettings = {
  get serviceUrl() {
    return process.env.EVALUATOR_URL || 'http://localhost:8787';
  },
  get serviceToken() {
    return process.env.WORKER_EVALUATOR_TOKEN;
  },
  get serviceRequestTimeoutMs() {
    return parseInt(process.env.EVALUATOR_REQUEST_TIMEOUT_MS || '195000', 10);
  },
} as const;
