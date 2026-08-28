import { EmptyState } from '../../../shared/components/feedback';
import type { UserPerformance } from '../types/statistic.types';

interface UserPerformanceTableProps {
  data: UserPerformance[];
}

export const UserPerformanceTable = ({ data }: UserPerformanceTableProps) => {
  if (data.length === 0) {
    return <EmptyState icon="👤" title="Chưa có dữ liệu" description="Chưa có công việc nào trong khoảng này." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-body">
        <thead className="border-b border-border bg-background text-small text-text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Người dùng</th>
            <th className="px-3 py-2 font-medium">Đã tạo</th>
            <th className="px-3 py-2 font-medium">Hoàn tất</th>
            <th className="px-3 py-2 font-medium">Tỉ lệ HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr key={row.userId}>
              <td className="px-3 py-2 text-text">{row.fullName}</td>
              <td className="px-3 py-2 text-text-muted">{row.created}</td>
              <td className="px-3 py-2 text-text-muted">{row.completed}</td>
              <td className="px-3 py-2 text-text-muted">{Math.round(row.completionRate * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
