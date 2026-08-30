import { toast } from 'sonner';
import { useUpdateTaskStatus } from './useUpdateTaskStatus';
import { useTaskTimerStore } from '../stores/taskTimer.store';
import type { Task } from '../types/task.types';

const PIP_WIDTH = 280;
const PIP_HEIGHT = 320;

/**
 * "Bắt đầu làm" (both `TodayPage` and `TaskListPage`, via `TaskTable`'s
 * `onStart`): requires `task.estimateMinutes` set, shows the countdown
 * timer, and for a `todo` task transitions it to `in_progress` via the
 * existing status state machine.
 *
 * The timer prefers **Document Picture-in-Picture** (Chrome/Edge 116+) — a
 * real, always-on-top window that stays visible even when the user switches
 * browser tabs, which nothing confined to one tab's DOM can do. Its one
 * downside — Chrome mandatorily shows a small origin bar ("localhost:5173")
 * on it, by design, for anti-phishing, and no API suppresses that — is a
 * trade a user explicitly decided is worth it for cross-tab visibility.
 * Falls back to `TaskTimerFloatingPanel` (in-page, one tab only, but zero
 * browser chrome) on browsers without the API.
 */
export const useStartTask = () => {
  const { mutate: updateStatus } = useUpdateTaskStatus();
  const openTimerSession = useTaskTimerStore((s) => s.openSession);

  const startTask = async (task: Task) => {
    if (!task.estimateMinutes) {
      toast.error('Vui lòng nhập thời lượng ước tính (phút) cho công việc trước khi bắt đầu.');
      return;
    }

    // Must be called synchronously off the click — no `await` before this —
    // or the browser no longer treats the window as opened "in response to
    // a user gesture" and refuses it.
    if (window.documentPictureInPicture) {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: PIP_WIDTH, height: PIP_HEIGHT });
      openTimerSession({ taskId: task.id, title: task.title, minutes: task.estimateMinutes, pipWindow });
    } else {
      openTimerSession({ taskId: task.id, title: task.title, minutes: task.estimateMinutes });
    }

    if (task.status === 'todo') {
      updateStatus({ id: task.id, status: 'in_progress' });
    }
  };

  return { startTask };
};
