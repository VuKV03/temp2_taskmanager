import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DateTime } from 'luxon';
import { Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { TaskList } from '../components/TaskList';
import { TaskFormModal } from '../components/TaskFormModal';
import { ROUTES } from '../../../routes/routes';

const StatCard = ({ value, label }: { value: number; label: string }) => (
  <div className="flex-1 rounded-md border border-border bg-white p-4 text-center">
    <p className="text-stat font-bold text-text">{value}</p>
    <p className="text-small text-text-muted">{label}</p>
  </div>
);

export const TodayPage = () => {
  const { data, isLoading, isError, refetch } = useTodayTasks();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  const openDetail = (id: number) => navigate(ROUTES.TASK_DETAIL.replace(':id', String(id)));

  const today = DateTime.now().setLocale('vi').toFormat('cccc, dd/MM/yyyy');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Hôm nay</h1>
        <p className="text-body capitalize text-text-muted">{today}</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
            <Skeleton className="h-20 flex-1" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được công việc hôm nay." onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="flex gap-3">
            <StatCard value={data.counters.today} label="Hôm nay" />
            <StatCard value={data.counters.completedToday} label="Đã xong" />
            <StatCard value={data.counters.overdue} label="Quá hạn" />
          </div>

          {data.overdue.length > 0 && (
            <div>
              <h2 className="mb-2 text-red-600">⚠ Quá hạn ({data.overdue.length})</h2>
              <TaskList tasks={data.overdue} onOpenDetail={openDetail} isOverdue />
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2>Hôm nay ({data.today.length})</h2>
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Thêm việc
              </Button>
            </div>

            {data.today.length === 0 && data.overdue.length === 0 ? (
              <EmptyState
                icon="☀️"
                title="Hôm nay không có việc nào"
                description="Nghỉ ngơi thôi, hoặc thêm một việc mới!"
                action={{ label: 'Thêm việc', onClick: () => setFormOpen(true) }}
              />
            ) : data.today.length === 0 ? (
              <p className="text-body text-text-muted">Không có việc nào khác cho hôm nay.</p>
            ) : (
              <TaskList tasks={data.today} onOpenDetail={openDetail} />
            )}
          </div>
        </>
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
};
