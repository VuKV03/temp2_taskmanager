/**
 * Route path constants
 * Using type-safe ROUTES object to avoid hardcoding paths
 */
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',

  // Main app
  TODAY: '/',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:id',
  LISTS: '/lists',
  LIST_DETAIL: '/lists/:id',
  STATISTIC: '/statistic',
  HISTORY: '/history',
  PROFILE: '/profile',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: '/admin/users/:id',
  ADMIN_HISTORY: '/admin/history',
  ADMIN_STATISTIC: '/admin/statistic',

  // 404
  NOT_FOUND: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
