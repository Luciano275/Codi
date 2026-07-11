import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  private readonly allowedOrigin: string;

  constructor() {
    this.allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return true;
    }

    const origin = request.headers['origin'] as string | undefined;
    const referer = request.headers['referer'] as string | undefined;

    if (origin) {
      if (origin !== this.allowedOrigin) {
        this.logger.warn(`CSRF: origin mismatch ${origin}`);
        return false;
      }
      return true;
    }

    if (referer) {
      if (!referer.startsWith(this.allowedOrigin)) {
        this.logger.warn(`CSRF: referer mismatch ${referer}`);
        return false;
      }
      return true;
    }

    this.logger.warn(`CSRF: no origin/referer for ${request.method} ${request.path}`);
    return true;
  }
}
