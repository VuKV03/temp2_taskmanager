import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '../../../routes/routes';

export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      // Server-side revoke can fail (network, already-expired token) — the
      // client must still forget the session either way.
      logout();
      queryClient.clear();
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });
};
