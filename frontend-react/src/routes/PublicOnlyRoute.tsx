import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../features/auth';
import { ROUTES } from './routes';

/**
 * Wraps /login, /register — redirects an already-authenticated user to the
 * app instead of showing the auth forms again (e.g. after login, or if
 * they navigate back to /login with a still-valid session).
 */
export const PublicOnlyRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  if (isInitializing) return null;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.TODAY} replace />;
  }

  return <Outlet />;
};
