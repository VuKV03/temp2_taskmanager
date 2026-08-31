import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiResponse } from '../../../shared/types/api';
import type { ApiError } from '../../../shared/lib/axios';
import { getErrorMessage } from '../../../shared/constants/error-messages';
import { authService } from '../services/auth.service';

export const useSendTelegramTest = () =>
  useMutation<ApiResponse<{ message: string }>, ApiError, void>({
    mutationFn: () => authService.sendTelegramTest(),
    onSuccess: () => toast.success('Đã gửi tin nhắn thử — kiểm tra Telegram của bạn'),
    onError: (error) => toast.error(getErrorMessage(error.code)),
  });
