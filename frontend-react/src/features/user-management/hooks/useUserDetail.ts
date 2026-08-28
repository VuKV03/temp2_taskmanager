import { useQuery } from '@tanstack/react-query';
import { userManagementService } from '../services/user-management.service';

export const useUserDetail = (id: number | undefined) =>
  useQuery({
    queryKey: ['admin-users', id],
    queryFn: () => userManagementService.getById(id!).then((res) => res.data!),
    enabled: id !== undefined,
  });
