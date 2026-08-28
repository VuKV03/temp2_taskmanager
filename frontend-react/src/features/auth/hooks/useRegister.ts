import { useMutation } from '@tanstack/react-query';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { authService } from '../services/auth.service';
import type { RegisterPayload, User } from '../types/auth.types';

// No auto-login after register (API_SPEC.md) — caller navigates to /login.
export const useRegister = () =>
  useMutation<ApiResponse<User>, ApiError, RegisterPayload>({
    mutationFn: (payload) => authService.register(payload),
  });
