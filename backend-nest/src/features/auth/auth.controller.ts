import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../shared/decorators/public.decorator.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../shared/decorators/current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (role always "member")' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login, get access token + refresh token cookie' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      deviceName: this.parseDeviceName(req.headers['user-agent']),
    });

    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);

    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  async refresh(@Req() req: Request) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    return this.authService.refresh(rawToken);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout, revoke current refresh token' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(user.id, rawToken);
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    return { message: 'Logged out' };
  }

  @ApiBearerAuth('access-token')
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  async logoutAll(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(user.id);
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    return { message: 'Logged out from all devices' };
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.id);
  }

  @ApiBearerAuth('access-token')
  @Patch('me')
  @ApiOperation({ summary: 'Update profile (name, avatar, timezone)' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @ApiBearerAuth('access-token')
  @Post('me/telegram/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test Telegram message to the linked chat id' })
  async sendTelegramTest(@CurrentUser() user: JwtPayload) {
    await this.authService.sendTelegramTest(user.id);
    return { message: 'Đã gửi tin nhắn thử nghiệm' };
  }

  @ApiBearerAuth('access-token')
  @Patch('change-password')
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto);
    return { message: 'Password changed successfully' };
  }

  @ApiBearerAuth('access-token')
  @ApiCookieAuth('refreshToken')
  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions' })
  sessions(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    return this.authService.sessions(user.id, rawToken);
  }

  @ApiBearerAuth('access-token')
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.authService.revokeSession(user.id, id);
    return { message: 'Session revoked' };
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      expires: expiresAt,
    });
  }

  private parseDeviceName(userAgent: string | undefined): string | null {
    if (!userAgent) return null;
    // Best-effort human-readable label, not a full UA parser.
    if (/edg/i.test(userAgent)) return 'Edge';
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    return 'Unknown device';
  }
}
