import { toUserResponse } from '../../auth/types/auth.types.js';
import type { UserResponse } from '../../auth/types/auth.types.js';
import type { User } from '../../auth/entities/user.entity.js';

export interface TaskStatsSummary {
  total: number;
  completed: number;
}

export interface AdminUserDetailResponse extends UserResponse {
  taskStats: TaskStatsSummary;
}

export function toAdminUserDetailResponse(user: User, taskStats: TaskStatsSummary): AdminUserDetailResponse {
  return { ...toUserResponse(user), taskStats };
}
