import type { User } from '../entities/user.entity.js';

export type UserRole = 'admin' | 'member';

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  timezone: string;
  telegramChatId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

export interface SessionResponse {
  id: number;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role.name,
    timezone: user.timezone,
    telegramChatId: user.telegramChatId,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}
