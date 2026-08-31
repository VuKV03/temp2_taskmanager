import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TelegramService } from '../../core/telegram/telegram.service.js';
import { AppException } from '../../shared/exceptions/app.exception.js';
import { ERROR_CODES } from '../../shared/constants/error-codes.constant.js';
import { hashPassword, verifyPassword } from '../../shared/utils/hash.util.js';
import { generateRefreshToken, hashToken, parseDurationMs } from '../../shared/utils/token.util.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { UserRepository } from './repositories/user.repository.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { Role } from './entities/role.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { toUserResponse } from './types/auth.types.js';
import type {
  UserResponse,
  LoginResponse,
  SessionResponse,
  RequestMeta,
} from './types/auth.types.js';

// Used to normalize response time when the email doesn't exist, so login
// timing doesn't leak whether an account exists.
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$5f2VxE0MTz4B1s2vN2b8rQ$4b1J8y8b2r1B4b1J8y8b2r1B4b1J8y8b2r1B';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly telegramService: TelegramService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponse> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppException(ERROR_CODES.AUTH_005);
    }

    // Role is always `member` — never accept role from the client.
    const memberRole = await this.roleRepo.findOne({ where: { name: 'member' } });
    if (!memberRole) {
      throw new Error('Member role not seeded — run `npm run seed`');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      timezone: dto.timezone || this.configService.get<string>('DEFAULT_TIMEZONE', 'Asia/Ho_Chi_Minh'),
      roleId: memberRole.id,
      role: memberRole,
    });
    const saved = await this.userRepository.save(user);

    // Non-critical side-effect (default "Cá nhân" list) — decoupled via
    // event so `auth` never imports `task-list` (see BE-ARCHITECTURE.md).
    this.eventEmitter.emit('user.registered', { userId: saved.id });

    return toUserResponse(saved);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<LoginResponse & { refreshToken: string; refreshExpiresAt: Date }> {
    const user = await this.userRepository.findByEmail(dto.email);

    const isPasswordValid = await verifyPassword(user ? user.passwordHash : DUMMY_HASH, dto.password);
    if (!user || !isPasswordValid) {
      throw new AppException(ERROR_CODES.AUTH_001);
    }

    if (!user.isActive) {
      throw new AppException(ERROR_CODES.AUTH_006);
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      timezone: user.timezone,
    };
    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(
      Date.now() + parseDurationMs(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')),
    );
    const refreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      deviceName: meta.deviceName,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: refreshExpiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`User ${user.id} logged in`);

    return {
      user: toUserResponse(user),
      accessToken,
      refreshToken: rawRefreshToken,
      refreshExpiresAt,
    };
  }

  async refresh(rawToken: string | undefined): Promise<{ accessToken: string }> {
    if (!rawToken) {
      throw new AppException(ERROR_CODES.AUTH_003);
    }

    const token = await this.refreshTokenRepository.findByTokenHash(hashToken(rawToken));
    if (!token) {
      throw new AppException(ERROR_CODES.AUTH_003);
    }
    if (token.isRevoked) {
      throw new AppException(ERROR_CODES.AUTH_007);
    }
    if (token.expiresAt.getTime() < Date.now()) {
      throw new AppException(ERROR_CODES.AUTH_002);
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user || !user.isActive) {
      throw new AppException(ERROR_CODES.AUTH_006);
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      timezone: user.timezone,
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async logout(userId: number, rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const token = await this.refreshTokenRepository.findByTokenHash(hashToken(rawToken));
    if (token && token.userId === userId) {
      await this.refreshTokenRepository.revokeById(token.id);
    }
  }

  async logoutAll(userId: number): Promise<void> {
    await this.refreshTokenRepository.revokeAllByUserId(userId);
  }

  async me(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ERROR_CODES.USER_001);
    }
    return toUserResponse(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ERROR_CODES.USER_001);
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.timezone !== undefined) user.timezone = dto.timezone;
    // Blank string = unlink, matching how the frontend clears the field.
    if (dto.telegramChatId !== undefined) user.telegramChatId = dto.telegramChatId.trim() || null;
    const saved = await this.userRepository.save(user);
    return toUserResponse(saved);
  }

  /** User-initiated "send me a test message" — unlike the event/cron-triggered sends, this one should surface a real error instead of failing silently. */
  async sendTelegramTest(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ERROR_CODES.USER_001);
    }
    if (!user.telegramChatId) {
      throw new AppException(ERROR_CODES.USER_006);
    }
    const sent = await this.telegramService.sendMessage(
      user.telegramChatId,
      `✅ Kết nối Telegram thành công! Từ giờ Task Manager sẽ báo cho bạn qua đây, ${user.fullName}.`,
    );
    if (!sent) {
      throw new AppException(ERROR_CODES.USER_007);
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppException(ERROR_CODES.USER_001);
    }
    const isOldPasswordValid = await verifyPassword(user.passwordHash, dto.oldPassword);
    if (!isOldPasswordValid) {
      throw new AppException(ERROR_CODES.USER_004);
    }
    user.passwordHash = await hashPassword(dto.newPassword);
    await this.userRepository.save(user);
    // Force re-login on every device after a password change.
    await this.refreshTokenRepository.revokeAllByUserId(userId);
  }

  async sessions(userId: number, currentRawToken: string | undefined): Promise<SessionResponse[]> {
    const currentHash = currentRawToken ? hashToken(currentRawToken) : null;
    const tokens = await this.refreshTokenRepository.findActiveByUserId(userId);
    return tokens.map((token) => ({
      id: token.id,
      deviceName: token.deviceName,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      createdAt: token.createdAt.toISOString(),
      expiresAt: token.expiresAt.toISOString(),
      isCurrent: token.tokenHash === currentHash,
    }));
  }

  async revokeSession(userId: number, sessionId: number): Promise<void> {
    const token = await this.refreshTokenRepository.findById(sessionId);
    if (!token || token.userId !== userId) {
      throw new AppException(ERROR_CODES.AUTH_008);
    }
    await this.refreshTokenRepository.revokeById(token.id);
  }
}
