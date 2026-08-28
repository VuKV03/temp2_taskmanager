import { useEffect } from 'react';
import { setUnauthorizedHandler } from '../../../shared/lib/axios';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

/**
 * Runs once on app mount. The access token only ever lives in memory, so a
 * full page reload loses it — this silently exchanges the httpOnly
 * `refreshToken` cookie for a new one before ProtectedRoute has to decide
 * whether to redirect to /login.
 */
export const useAuthBootstrap = () => {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const finishInitializing = useAuthStore((s) => s.finishInitializing);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    authService
      .refresh()
      .then((res) => {
        if (cancelled) return;
        setAccessToken(res.data!.accessToken);
        return authService.me().then((meRes) => {
          if (!cancelled) setUser(meRes.data!);
        });
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) finishInitializing();
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isInitializing };
};
