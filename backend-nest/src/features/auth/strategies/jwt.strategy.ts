import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  // Stateless validation — no DB round-trip per request. Access tokens are
  // short-lived (15m); revocation (role change / account lock) takes effect
  // on next refresh, not mid-flight, per the auth business rules.
  validate(payload: JwtPayload): JwtPayload {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      timezone: payload.timezone,
    };
  }
}
