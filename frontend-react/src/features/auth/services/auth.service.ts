import { api } from '../../../shared/lib/axios';
import type { ApiResponse } from '../../../shared/types/api';
import type {
  User,
  LoginPayload,
  RegisterPayload,
  LoginResponseData,
  UpdateProfilePayload,
  ChangePasswordPayload,
  Session,
} from '../types/auth.types';

export const authService = {
  register: (payload: RegisterPayload) => api.post<ApiResponse<User>>('/auth/register', payload),

  login: (payload: LoginPayload) => api.post<ApiResponse<LoginResponseData>>('/auth/login', payload),

  refresh: () => api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () => api.post<ApiResponse<{ message: string }>>('/auth/logout'),

  logoutAll: () => api.post<ApiResponse<{ message: string }>>('/auth/logout-all'),

  me: () => api.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (payload: UpdateProfilePayload) => api.patch<ApiResponse<User>>('/auth/me', payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.patch<ApiResponse<{ message: string }>>('/auth/change-password', payload),

  sessions: () => api.get<ApiResponse<Session[]>>('/auth/sessions'),

  revokeSession: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/auth/sessions/${id}`),
};
