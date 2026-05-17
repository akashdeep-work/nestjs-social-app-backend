import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null; // Will be null if not authenticated
  },
);

export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Extract base IP (Express sets this automatically if trust proxy = true)
    let ip = request.ip || request.socket?.remoteAddress || '';

    // Normalize IPv6-mapped IPv4 addresses like ::ffff:192.168.0.1
    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    // Fallback: check X-Forwarded-For header if still internal/loopback
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      const forwardedFor = request.headers['x-forwarded-for'];
      if (typeof forwardedFor === 'string') {
        ip = forwardedFor.split(',')[0].trim();
      }
    }

    return ip;
  },
);

