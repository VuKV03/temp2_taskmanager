import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { AppException } from '../exceptions/app.exception.js';
import { ERROR_CODES } from '../constants/error-codes.constant.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  // Map passport-jwt failures to the documented AUTH_00X codes instead of
  // the default generic 401 "Unauthorized" (which the exception filter
  // would otherwise report as SYS_001).
  handleRequest<TUser = unknown>(err: unknown, user: TUser, info?: { name?: string } | Error): TUser {
    if (err || !user) {
      if (info && 'name' in info && info.name === 'TokenExpiredError') {
        throw new AppException(ERROR_CODES.AUTH_002);
      }
      throw new AppException(ERROR_CODES.AUTH_003);
    }
    return user;
  }
}
