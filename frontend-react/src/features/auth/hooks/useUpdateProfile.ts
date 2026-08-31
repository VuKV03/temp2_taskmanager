import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import type { User, UpdateProfilePayload } from '../types/auth.types';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<ApiResponse<User>, ApiError, UpdateProfilePayload>({
    mutationFn: (payload) => authService.updateProfile(payload),
    onSuccess: (res) => {
      setUser(res.data!);
      queryClient.setQueryData(['auth', 'me'], res.data);
      toast.success('Đã lưu thay đổi');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
