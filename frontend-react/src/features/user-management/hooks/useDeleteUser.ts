import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementService } from '../services/user-management.service';

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userManagementService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
};
