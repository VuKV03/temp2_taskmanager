import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AppException } from '../exceptions/app.exception.js';
import { ERROR_CODES } from '../constants/error-codes.constant.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user: any }>();
    const user = request.user;

    if (!user) {
      throw new AppException(ERROR_CODES.AUTH_003);
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new AppException(ERROR_CODES.AUTH_004);
    }

    return true;
  }
}
