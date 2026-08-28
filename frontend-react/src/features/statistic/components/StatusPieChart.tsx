import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { EmptyState } from '../../../shared/components/feedback';
import { TASK_STATUS_LABEL } from '../../task/types/task.types';
import type { StatusCount } from '../types/statistic.types';

const COLOR: Record<StatusCount['status'], string> = {
  todo: 'var(--color-status-todo-text)',
  in_progress: 'var(--color-status-in-progress-text)',
  done: 'var(--color-status-done-text)',
  cancelled: 'var(--color-status-cancelled-text)',
};

interface StatusPieChartProps {
  data: StatusCount[];
}

export const StatusPieChart = ({ data }: StatusPieChartProps) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <EmptyState icon="📊" title="Chưa có dữ liệu" description="Chưa có công việc nào trong khoảng này." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLOR[entry.status]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, entry) => {
            const status = (entry.payload as unknown as StatusCount).status;
            return [value, TASK_STATUS_LABEL[status]];
          }}
          contentStyle={{ borderRadius: 8, borderColor: 'var(--color-border)', fontSize: 13 }}
        />
        <Legend
          formatter={(_value, entry) => {
            const status = (entry.payload as unknown as StatusCount).status;
            return <span className="text-small text-text">{TASK_STATUS_LABEL[status]}</span>;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
