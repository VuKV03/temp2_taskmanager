import { useSearchParams } from 'react-router';
import { BarChart3, Flame } from 'lucide-react';
import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { DateRangePicker } from '../components/DateRangePicker';
import { SummaryCards } from '../components/SummaryCards';
import { CompletionChart } from '../components/CompletionChart';
import { StatusPieChart } from '../components/StatusPieChart';
import { PriorityBarChart } from '../components/PriorityBarChart';
import { useStatsSummary } from '../hooks/useStatsSummary';
import { useCompletionTrend } from '../hooks/useCompletionTrend';

export const StatisticPage = () => {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const { data: summary, isLoading, isError, refetch } = useStatsSummary({ from, to });
  const { data: completion } = useCompletionTrend({ from, to, groupBy: 'day' });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-text-muted" />
          <h1>Thống kê</h1>
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

      {summary && (
        <>
          <SummaryCards totals={summary.totals} />

          {summary.streakDays > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-body text-text">
              <Flame className="h-5 w-5 text-priority-urgent" />
              Chuỗi hoàn thành: <span className="font-semibold">{summary.streakDays} ngày</span>
              {summary.avgCompletionHours > 0 && (
                <span className="text-text-muted">
                  · Trung bình {summary.avgCompletionHours}h để hoàn thành 1 việc
                </span>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-2 text-body font-semibold text-text">Xu hướng hoàn thành</h3>
              <CompletionChart data={completion ?? []} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-2 text-body font-semibold text-text">Theo trạng thái</h3>
              <StatusPieChart data={summary.byStatus} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 md:col-span-2">
              <h3 className="mb-2 text-body font-semibold text-text">Theo độ ưu tiên</h3>
              <PriorityBarChart data={summary.byPriority} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
