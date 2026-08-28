import { useMutation } from '@tanstack/react-query';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { userManagementService } from '../services/user-management.service';

export const useResetUserPassword = () =>
  useMutation<ApiResponse<{ message: string }>, ApiError, { id: number; newPassword: string }>({
    mutationFn: ({ id, newPassword }) => userManagementService.resetPassword(id, newPassword),
  });
