import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PlusCircle, Pencil, ArrowRightLeft, UserPlus, MessageSquare, Archive, Trash2 } from 'lucide-react';
import { getTimeAgo } from '../../../shared/lib/datetime';
import { ROUTES } from '../../../routes/routes';
import { ACTIVITY_ACTION_LABEL } from '../types/activity.types';
import type { Activity, ActivityAction } from '../types/activity.types';

const ACTION_ICON: Record<ActivityAction, ReactNode> = {
  created: <PlusCircle className="h-4 w-4" />,
  updated: <Pencil className="h-4 w-4" />,
  status_changed: <ArrowRightLeft className="h-4 w-4" />,
  assigned: <UserPlus className="h-4 w-4" />,
  commented: <MessageSquare className="h-4 w-4" />,
  archived: <Archive className="h-4 w-4" />,
  deleted: <Trash2 className="h-4 w-4" />,
};

// Reuse the status palette rather than inventing new tokens: green for
// "added something", blue for "changed something", grey for "removed something".
const ACTION_COLOR: Record<ActivityAction, string> = {
  created: 'bg-status-done text-status-done-text',
  updated: 'bg-status-in-progress text-status-in-progress-text',
  status_changed: 'bg-status-in-progress text-status-in-progress-text',
  assigned: 'bg-status-in-progress text-status-in-progress-text',
  commented: 'bg-status-in-progress text-status-in-progress-text',
  archived: 'bg-status-cancelled text-status-cancelled-text',
  deleted: 'bg-status-cancelled text-status-cancelled-text',
};

function describe(activity: Activity): string {
  const { action, fieldName, oldValue, newValue } = activity;
  switch (action) {
    case 'created':
      return 'đã tạo công việc';
    case 'status_changed':
      return oldValue && newValue ? `đã đổi trạng thái từ "${oldValue}" sang "${newValue}"` : 'đã đổi trạng thái';
    case 'assigned':
      return newValue ? `đã gán công việc cho ${newValue}` : 'đã gán công việc';
    case 'commented':
      return 'đã bình luận vào công việc';
    case 'archived':
      return 'đã lưu trữ công việc';
    case 'deleted':
      return 'đã xoá công việc';
    case 'updated':
    default:
      return fieldName ? `đã cập nhật ${fieldName}` : 'đã cập nhật công việc';
  }
}

interface ActivityItemProps {
  activity: Activity;
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  const taskLink = !activity.taskDeleted && activity.taskId !== null;

  return (
    <li className="flex gap-3 py-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ACTION_COLOR[activity.action]}`}
        aria-hidden="true"
      >
        {ACTION_ICON[activity.action]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body text-text">
          <span className="font-medium">{activity.user.fullName}</span> {describe(activity)}{' '}
          {taskLink ? (
            <Link
              to={ROUTES.TASK_DETAIL.replace(':id', String(activity.taskId))}
              className="font-medium text-primary hover:underline"
            >
              "{activity.taskTitle}"
            </Link>
          ) : (
            <span className="text-text-muted">"{activity.taskTitle}"{activity.taskDeleted ? ' (đã xoá)' : ''}</span>
          )}
        </p>
        <p className="text-small text-text-muted">
          {ACTIVITY_ACTION_LABEL[activity.action]} · {getTimeAgo(activity.createdAt)}
        </p>
      </div>
    </li>
  );
};
