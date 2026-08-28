import { api } from '../../../shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '../../../shared/types/api';
import type {
  AdminUser,
  AdminUserDetail,
  UserParams,
  CreateUserPayload,
  UpdateUserPayload,
  UserRole,
} from '../types/user-management.types';

export const userManagementService = {
  getAll: (params: UserParams) => api.get<PaginatedResponse<AdminUser>>('/admin/users', { params }),
  getById: (id: number) => api.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`),
  create: (payload: CreateUserPayload) => api.post<ApiResponse<AdminUser>>('/admin/users', payload),
  update: (id: number, payload: UpdateUserPayload) =>
    api.patch<ApiResponse<AdminUser>>(`/admin/users/${id}`, payload),
  updateRole: (id: number, role: UserRole) =>
    api.patch<ApiResponse<AdminUser>>(`/admin/users/${id}/role`, { role }),
  updateStatus: (id: number, isActive: boolean) =>
    api.patch<ApiResponse<AdminUser>>(`/admin/users/${id}/status`, { isActive }),
  resetPassword: (id: number, newPassword: string) =>
    api.patch<ApiResponse<{ message: string }>>(`/admin/users/${id}/reset-password`, { newPassword }),
  remove: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/admin/users/${id}`),
};
