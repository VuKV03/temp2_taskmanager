export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assigned'
  | 'commented'
  | 'archived'
  | 'deleted';

export const ACTIVITY_ACTION_LABEL: Record<ActivityAction, string> = {
  created: 'Tạo mới',
  updated: 'Cập nhật',
  status_changed: 'Đổi trạng thái',
  assigned: 'Gán việc',
  commented: 'Bình luận',
  archived: 'Lưu trữ',
  deleted: 'Xoá',
};

export interface Activity {
  id: number;
  action: ActivityAction;
  taskId: number | null;
  taskTitle: string;
  taskDeleted: boolean;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  user: { id: number; fullName: string };
  createdAt: string;
}

export interface ActivityParams {
  page?: number;
  limit?: number;
  action?: ActivityAction;
  from?: string;
  to?: string;
}

export interface AdminActivityParams extends ActivityParams {
  userId?: number;
}
