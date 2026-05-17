import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'];

    // If no auth header → skip AuthGuard completely
    if (!authHeader) {
      return true; // let the request through without user
    }

    // Otherwise run normal JWT auth
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      return null; // no crash, just no user
    }
    return user;
  }
}
