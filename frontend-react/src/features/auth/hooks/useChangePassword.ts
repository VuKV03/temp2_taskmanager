import { useMutation } from '@tanstack/react-query';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { authService } from '../services/auth.service';
import type { ChangePasswordPayload } from '../types/auth.types';

export const useChangePassword = () =>
  useMutation<ApiResponse<{ message: string }>, ApiError, ChangePasswordPayload>({
    mutationFn: (payload) => authService.changePassword(payload),
  });
