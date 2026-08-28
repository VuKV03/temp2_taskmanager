import { useMutation } from '@tanstack/react-query';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import type { LoginPayload, LoginResponseData } from '../types/auth.types';

export const useLogin = () => {
  const login = useAuthStore((s) => s.login);

  return useMutation<ApiResponse<LoginResponseData>, ApiError, LoginPayload>({
    mutationFn: (payload) => authService.login(payload),
    onSuccess: (res) => {
      login(res.data!.user, res.data!.accessToken);
    },
  });
};
