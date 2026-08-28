import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { userManagementService } from '../services/user-management.service';
import type { AdminUser, CreateUserPayload } from '../types/user-management.types';

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<AdminUser>, ApiError, CreateUserPayload>({
    mutationFn: (payload) => userManagementService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
};
