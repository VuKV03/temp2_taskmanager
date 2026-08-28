export type UserRole = 'admin' | 'member';

export interface AdminUser {
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

export interface AdminUserDetail extends AdminUser {
  taskStats: { total: number; completed: number };
}

export interface UserParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  q?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  timezone?: string;
}

export type UpdateUserPayload = Partial<Pick<CreateUserPayload, 'fullName' | 'timezone'>> & { avatarUrl?: string };
