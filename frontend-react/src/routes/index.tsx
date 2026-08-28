import { createBrowserRouter } from 'react-router';
import type { RouteObject } from 'react-router';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { AdminRoute } from './AdminRoute';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage, RegisterPage } from '../features/auth';
import { TodayPage, TaskListPage, TaskDetailPage } from '../features/task';
import { HistoryPage, AdminHistoryPage } from '../features/activity';
import { StatisticPage, AdminStatisticPage } from '../features/statistic';
import { AdminUserListPage, AdminUserDetailPage } from '../features/user-management';
import { ROUTES } from './routes';

/**
 * Router configuration
 * Structure:
 * - Public: Login, Register
 * - Protected: Main app with sidebar
 * - Admin: Admin-only pages
 */

const publicRoutes: RouteObject[] = [
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },
];

const protectedRoutes: RouteObject[] = [
  { index: true, element: <TodayPage /> },
  { path: 'tasks', element: <TaskListPage /> },
  { path: 'tasks/:id', element: <TaskDetailPage /> },
  { path: 'lists/:id', element: <TaskListPage /> },
  { path: 'history', element: <HistoryPage /> },
  { path: 'statistic', element: <StatisticPage /> },
];

const adminRoutes: RouteObject[] = [
  { path: 'history', element: <AdminHistoryPage /> },
  { path: 'statistic', element: <AdminStatisticPage /> },
  { path: 'users', element: <AdminUserListPage /> },
  { path: 'users/:id', element: <AdminUserDetailPage /> },
];

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: publicRoutes,
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: protectedRoutes,
      },
    ],
  },

  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: adminRoutes,
      },
    ],
  },

  // { path: '*', element: <NotFoundPage /> },
]);
