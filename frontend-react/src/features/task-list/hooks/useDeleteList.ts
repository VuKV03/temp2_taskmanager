import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { taskListService } from '../services/task-list.service';

export const useDeleteList = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ message: string }>, ApiError, number>({
    mutationFn: (id) => taskListService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('Đã lưu trữ danh sách');
    },
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
};
