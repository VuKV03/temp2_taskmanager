import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { EmptyState } from '../../../shared/components/feedback';
import { formatDate } from '../../../shared/lib/datetime';
import type { CompletionPoint } from '../types/statistic.types';

interface CompletionChartProps {
  data: CompletionPoint[];
}

export const CompletionChart = ({ data }: CompletionChartProps) => {
  if (data.length === 0) {
    return <EmptyState icon="📈" title="Chưa có dữ liệu" description="Chưa có công việc nào hoàn thành trong khoảng này." />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => formatDate(value)}
          tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          labelFormatter={(value) => (typeof value === 'string' ? formatDate(value) : value)}
          formatter={(value) => [value, 'Hoàn thành']}
          contentStyle={{ borderRadius: 8, borderColor: 'var(--color-border)', fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
