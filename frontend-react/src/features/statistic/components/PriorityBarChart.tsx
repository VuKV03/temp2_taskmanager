import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { EmptyState } from '../../../shared/components/feedback';
import { TASK_PRIORITY_LABEL } from '../../task/types/task.types';
import type { PriorityCount } from '../types/statistic.types';

const COLOR: Record<PriorityCount['priority'], string> = {
  urgent: 'var(--color-priority-urgent)',
  high: 'var(--color-priority-high)',
  medium: 'var(--color-priority-medium)',
  low: 'var(--color-priority-low)',
};

interface PriorityBarChartProps {
  data: PriorityCount[];
}

export const PriorityBarChart = ({ data }: PriorityBarChartProps) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <EmptyState icon="📊" title="Chưa có dữ liệu" description="Chưa có công việc nào trong khoảng này." />;
  }

  const chartData = data.map((d) => ({ ...d, label: TASK_PRIORITY_LABEL[d.priority] }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, borderColor: 'var(--color-border)', fontSize: 13 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.priority} fill={COLOR[entry.priority]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
