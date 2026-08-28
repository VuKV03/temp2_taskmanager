import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../features/auth';
import { FullPageSpinner } from '../shared/components/feedback';
import { ROUTES } from './routes';

/**
 * ProtectedRoute: Requires authentication
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  // Wait for the silent-refresh-on-load attempt (see useAuthBootstrap)
  // before deciding — otherwise every full page reload bounces to /login.
  if (isInitializing) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};
