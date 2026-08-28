import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementService } from '../services/user-management.service';
import type { UserRole } from '../types/user-management.types';

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => userManagementService.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
};
