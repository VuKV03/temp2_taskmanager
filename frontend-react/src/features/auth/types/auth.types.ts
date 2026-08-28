export type UserRole = 'admin' | 'member';

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  timezone: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  timezone?: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: User;
}

export interface UpdateProfilePayload {
  fullName?: string;
  avatarUrl?: string;
  timezone?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface Session {
  id: number;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
