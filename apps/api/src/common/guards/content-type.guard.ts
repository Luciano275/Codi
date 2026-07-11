import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class ContentTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') {
      return true;
    }

    const contentType = request.headers['content-type'] as string | undefined;
    if (!contentType || !contentType.startsWith('application/json')) {
      throw new BadRequestException('Content-Type must be application/json');
    }

    return true;
  }
}
