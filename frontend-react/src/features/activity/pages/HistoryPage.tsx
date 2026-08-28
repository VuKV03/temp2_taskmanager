import { useSearchParams } from 'react-router';
import { History } from 'lucide-react';
import { Button } from '../../../shared/components/ui';
import { Skeleton, ErrorState, EmptyState } from '../../../shared/components/feedback';
import { ActivityFilters } from '../components/ActivityFilters';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { useActivities } from '../hooks/useActivities';
import type { ActivityAction } from '../types/activity.types';

export const HistoryPage = () => {
  const [searchParams] = useSearchParams();
  const action = (searchParams.get('action') || undefined) as ActivityAction | undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivities({
    action,
    from,
    to,
    limit: 20,
  });

  const activities = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-text-muted" />
        <h1>Lịch sử hoạt động</h1>
      </div>

      <ActivityFilters />

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không tải được lịch sử." onRetry={() => refetch()} />}

      {!isLoading && !isError && activities.length === 0 && (
        <EmptyState icon="🕒" title="Chưa có hoạt động nào" description="Lịch sử thao tác của bạn sẽ hiện ở đây." />
      )}

      {activities.length > 0 && <ActivityTimeline activities={activities} />}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={() => fetchNextPage()} isLoading={isFetchingNextPage}>
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
};
