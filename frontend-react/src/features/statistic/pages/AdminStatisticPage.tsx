import { useSearchParams } from 'react-router';
import { BarChart3 } from 'lucide-react';
import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { DateRangePicker } from '../components/DateRangePicker';
import { SummaryCards } from '../components/SummaryCards';
import { StatusPieChart } from '../components/StatusPieChart';
import { PriorityBarChart } from '../components/PriorityBarChart';
import { UserPerformanceTable } from '../components/UserPerformanceTable';
import { useAdminStatsOverview, useAdminStatsByUser } from '../hooks/useAdminStats';

export const AdminStatisticPage = () => {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const { data: overview, isLoading, isError, refetch } = useAdminStatsOverview({ from, to });
  const { data: byUser } = useAdminStatsByUser({ from, to });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-text-muted" />
          <h1>Thống kê toàn hệ thống</h1>
        </div>
        <DateRangePicker />
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState description="Không tải được thống kê." onRetry={() => refetch()} />}

      {overview && (
        <>
          <SummaryCards totals={overview.totals} />
          <p className="text-small text-text-muted">Tổng số người dùng: {overview.totals.totalUsers}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4">
              <h3 className="mb-2 text-body font-semibold text-text">Theo trạng thái</h3>
              <StatusPieChart data={overview.byStatus} />
            </div>
            <div className="rounded-lg border border-border bg-white p-4">
              <h3 className="mb-2 text-body font-semibold text-text">Theo độ ưu tiên</h3>
              <PriorityBarChart data={overview.byPriority} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-body font-semibold text-text">Hiệu suất theo người dùng</h3>
            <UserPerformanceTable data={byUser ?? []} />
          </div>
        </>
      )}
    </div>
  );
};
