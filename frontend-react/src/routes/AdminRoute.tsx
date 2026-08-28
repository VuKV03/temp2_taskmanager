import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../features/auth';
import { FullPageSpinner } from '../shared/components/feedback';
import { ROUTES } from './routes';

/**
 * AdminRoute: Requires admin role
 * Redirects to home if user doesn't have admin role
 * Note: Server still validates independently with RolesGuard
 */
export const AdminRoute = () => {
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  // Same reasoning as ProtectedRoute — wait for the silent-refresh-on-load
  // attempt before deciding, otherwise a full page reload/direct nav on any
  // /admin/* route bounces away before `user` is repopulated.
  if (isInitializing) {
    return <FullPageSpinner />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to={ROUTES.TODAY} replace />;
  }

  return <Outlet />;
};
