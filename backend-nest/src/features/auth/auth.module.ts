import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramModule } from '../../core/telegram/telegram.module.js';
import { parseDurationMs } from '../../shared/utils/token.util.js';
import { Role } from './entities/role.entity.js';
import { User } from './entities/user.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { UserRepository } from './repositories/user.repository.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        // `parseDurationMs` reuses the same '15m'/'7d' parser as refresh
        // tokens; @nestjs/jwt's `expiresIn` accepts a number of seconds.
        signOptions: {
          expiresIn: Math.floor(parseDurationMs(configService.get<string>('JWT_EXPIRES_IN', '15m')) / 1000),
        },
      }),
    }),
    TelegramModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, RefreshTokenRepository, JwtStrategy],
  // Other features (task, task-list, ...) read user data through this
  // module's exports — never import auth's internal files directly.
  exports: [TypeOrmModule, UserRepository, AuthService],
})
export class AuthModule {}
