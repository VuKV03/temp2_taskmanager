import { useSearchParams } from 'react-router';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { ActivityFilters } from '../components/ActivityFilters';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { useAdminActivities } from '../hooks/useAdminActivities';
import type { ActivityAction } from '../types/activity.types';

/** System-wide history, admin only — same filters as the personal page plus a userId filter. */
export const AdminHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const action = (searchParams.get('action') || undefined) as ActivityAction | undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined;
  const page = Number(searchParams.get('page') ?? '1');

  const { data, isLoading, isError, refetch } = useAdminActivities({ action, from, to, userId, page, limit: 20 });

  const setPage = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    });
  };

  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-text-muted" />
        <h1>Lịch sử toàn hệ thống</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ActivityFilters />
        <Input
          type="number"
          min={1}
          placeholder="Lọc theo User ID"
          value={userId ?? ''}
          onChange={(e) => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value) next.set('userId', e.target.value);
              else next.delete('userId');
              next.delete('page');
              return next;
            });
          }}
          className="w-40"
          aria-label="Lọc theo User ID"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được lịch sử." onRetry={() => refetch()} />}

      {data && data.data.length === 0 && (
        <EmptyState icon="🕒" title="Không có hoạt động nào" description="Chưa có hoạt động nào khớp bộ lọc." />
      )}

      {data && data.data.length > 0 && (
        <>
          <ActivityTimeline activities={data.data} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-small text-text-muted">
              <span>
                Trang {page} / {totalPages} · {data.meta.total} hoạt động
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Trang trước"
                  className="rounded p-1 hover:bg-background disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Trang sau"
                  className="rounded p-1 hover:bg-background disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
