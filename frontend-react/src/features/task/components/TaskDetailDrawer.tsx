import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DateTime } from 'luxon';
import { Drawer, Checkbox, Select, Textarea, ConfirmDialog, Button } from '../../../shared/components/ui';
import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { formatDateTime } from '../../../shared/lib/datetime';
import { useLists } from '../../../features/task-list';
import { ActivityTimeline, useTaskActivities } from '../../../features/activity';
import { CommentList, AttachmentList } from '../../../features/collaboration';
import { useAuthStore } from '../../../features/auth';
import { useUsers } from '../../../features/user-management';
import { useTask } from '../hooks/useTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useReplaceTags } from '../hooks/useReplaceTags';
import { useAssignTask } from '../hooks/useAssignTask';
import { SubtaskList } from './SubtaskList';
import { TagPicker } from './TagPicker';
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL, TASK_STATUS_TRANSITIONS } from '../types/task.types';
import type { TaskStatus, TaskPriority, TagSummary } from '../types/task.types';

interface TaskDetailDrawerProps {
  taskId: number | undefined;
  onClose: () => void;
}

export const TaskDetailDrawer = ({ taskId, onClose }: TaskDetailDrawerProps) => {
  const { data: task, isLoading, isError, refetch } = useTask(taskId);
  const { data: lists } = useLists();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: replaceTags } = useReplaceTags();
  const { mutate: assignTask, isPending: isAssigning } = useAssignTask();
  const { data: activityPage } = useTaskActivities(task?.id, { limit: 5 });
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  // Business rule #8: only admin can reassign — skip the user list fetch otherwise.
  const { data: usersPage } = useUsers({ limit: 100 }, isAdmin);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
  }, [task?.id, task?.title, task?.description]);

  const open = taskId !== undefined;

  return (
    <Drawer open={open} onClose={onClose} title="Chi tiết">
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được công việc." onRetry={() => refetch()} />}

      {task && (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === 'done'}
              onChange={() => updateStatus({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' })}
              aria-label={`Đánh dấu hoàn thành: ${task.title}`}
              className="mt-1"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== task.title) {
                  updateTask({ id: task.id, payload: { title: title.trim() } });
                } else {
                  setTitle(task.title);
                }
              }}
              className="w-full flex-1 border-none bg-transparent text-h2 font-heading text-text outline-none focus:ring-0"
              aria-label="Tiêu đề công việc"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={task.status}
              onChange={(e) => updateStatus({ id: task.id, status: e.target.value as TaskStatus })}
              className="w-auto"
              aria-label="Trạng thái"
            >
              {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                  disabled={value !== task.status && !TASK_STATUS_TRANSITIONS[task.status].includes(value as TaskStatus)}
                >
                  {label}
                </option>
              ))}
            </Select>

            <Select
              value={task.priority}
              onChange={(e) =>
                updateTask({ id: task.id, payload: { priority: e.target.value as TaskPriority } })
              }
              className="w-auto"
              aria-label="Độ ưu tiên"
            >
              {Object.entries(TASK_PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-body">
            <div>
              <label className="mb-1 block text-small text-text-muted">Hạn chót</label>
              <input
                type="datetime-local"
                value={task.dueDate ? DateTime.fromISO(task.dueDate).toFormat("yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => {
                  const iso = e.target.value ? DateTime.fromISO(e.target.value).toUTC().toISO() : null;
                  updateTask({ id: task.id, payload: { dueDate: iso ?? undefined } });
                }}
                className="h-9 w-full rounded-md border border-border px-2 text-small"
              />
            </div>
            <div>
              <label className="mb-1 block text-small text-text-muted">Danh sách</label>
              <Select
                value={task.list?.id ?? ''}
                onChange={(e) =>
                  updateTask({
                    id: task.id,
                    payload: { listId: e.target.value ? Number(e.target.value) : null },
                  })
                }
                className="h-9"
              >
                <option value="">Không thuộc danh sách</option>
                {lists?.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-small text-text-muted">
            <span>Người tạo: {task.creator.fullName}</span>
            {isAdmin ? (
              <label className="flex items-center gap-1.5">
                · Phụ trách:
                <Select
                  value={task.assignee?.id ?? ''}
                  onChange={(e) => assignTask({ id: task.id, assigneeId: Number(e.target.value) })}
                  disabled={isAssigning || !usersPage}
                  className="h-7 w-auto py-0 text-small"
                  aria-label="Người phụ trách"
                >
                  {usersPage?.data.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </Select>
              </label>
            ) : (
              task.assignee &&
              task.assignee.id !== task.creator.id && <span>· Phụ trách: {task.assignee.fullName}</span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-small font-semibold uppercase tracking-wide text-text-muted">
              Nhãn
            </label>
            <TagPicker
              value={task.tags}
              onChange={(tags: TagSummary[]) => replaceTags({ id: task.id, tagIds: tags.map((t) => t.id) })}
            />
          </div>

          <div>
            <label className="mb-1 block text-small font-semibold uppercase tracking-wide text-text-muted">
              Mô tả
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (task.description ?? '')) {
                  updateTask({ id: task.id, payload: { description } });
                }
              }}
              rows={4}
              placeholder="Thêm mô tả..."
            />
          </div>

          {task.parentTaskId === null && (
            <SubtaskList parentTaskId={task.id} subtasks={task.subtasks ?? []} />
          )}

          <p className="text-small text-text-muted">
            Tạo lúc {formatDateTime(task.createdAt)} · Cập nhật {formatDateTime(task.updatedAt)}
          </p>

          <div className="border-t border-border pt-4">
            <AttachmentList taskId={task.id} />
          </div>

          <div className="border-t border-border pt-4">
            <CommentList taskId={task.id} />
          </div>

          {activityPage && activityPage.data.length > 0 && (
            <div className="border-t border-border pt-4">
              <label className="mb-1 block text-small font-semibold uppercase tracking-wide text-text-muted">
                Lịch sử gần đây
              </label>
              <ActivityTimeline activities={activityPage.data} />
            </div>
          )}

          <div className="border-t border-border pt-4">
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Xoá công việc
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => task && deleteTask(task.id, { onSuccess: () => { setConfirmDelete(false); onClose(); } })}
        title="Xoá công việc?"
        description="Công việc sẽ được lưu trữ và không còn hiển thị trong danh sách."
        confirmLabel="Xoá"
        isLoading={isDeleting}
      />
    </Drawer>
  );
};
