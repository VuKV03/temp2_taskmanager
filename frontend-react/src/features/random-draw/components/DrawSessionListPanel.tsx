import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { cn } from '../../../shared/utils/cn';
import { useDrawSessions } from '../hooks/useDrawSessions';

interface DrawSessionListPanelProps {
  selectedId: number | undefined;
  onSelect: (id: number) => void;
}

export const DrawSessionListPanel = ({ selectedId, onSelect }: DrawSessionListPanelProps) => {
  const { data: sessions, isLoading, isError, refetch } = useDrawSessions();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Không tải được danh sách phiên." onRetry={() => refetch()} />;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState icon="🎲" title="Chưa có phiên nào" description="Tạo phiên bốc thăm đầu tiên để bắt đầu phân việc ngẫu nhiên." />
    );
  }

  return (
    <div className="space-y-1.5">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelect(session.id)}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-left transition-colors',
            selectedId === session.id
              ? 'border-primary bg-primary/10'
              : 'border-border bg-surface hover:bg-background',
          )}
        >
          <p className="truncate text-body font-medium text-text">{session.name}</p>
          <p className="text-small text-text-muted">
            {session.status === 'completed' ? 'Đã bốc hết' : `Còn lại ${session.remainingCount}/${session.totalCount}`}
          </p>
        </button>
      ))}
    </div>
  );
};
