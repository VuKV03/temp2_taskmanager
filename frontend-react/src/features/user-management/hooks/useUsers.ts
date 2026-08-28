import { useQuery } from '@tanstack/react-query';
import { userManagementService } from '../services/user-management.service';
import type { UserParams } from '../types/user-management.types';

/** `/admin/users` is admin-only server-side — pass `enabled: false` for non-admin callers (e.g. the task assignee picker). */
export const useUsers = (params: UserParams, enabled = true) =>
  useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => userManagementService.getAll(params),
    enabled,
  });
