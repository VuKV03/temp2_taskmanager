import { useSearchParams } from 'react-router';
import { Input, Select } from '../../../shared/components/ui';
import { ACTIVITY_ACTION_LABEL } from '../types/activity.types';
import type { ActivityAction } from '../types/activity.types';

const ACTION_OPTIONS = Object.keys(ACTIVITY_ACTION_LABEL) as ActivityAction[];

export const ActivityFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const action = searchParams.get('action') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  const hasFilters = !!(action || from || to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={action}
        onChange={(e) => setParam('action', e.target.value)}
        className="w-40"
        aria-label="Lọc theo hành động"
      >
        <option value="">Mọi hành động</option>
        {ACTION_OPTIONS.map((a) => (
          <option key={a} value={a}>
            {ACTIVITY_ACTION_LABEL[a]}
          </option>
        ))}
      </Select>

      <Input
        type="date"
        value={from}
        onChange={(e) => setParam('from', e.target.value)}
        className="w-40"
        aria-label="Từ ngày"
      />
      <Input
        type="date"
        value={to}
        onChange={(e) => setParam('to', e.target.value)}
        className="w-40"
        aria-label="Đến ngày"
      />

      {hasFilters && (
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className="text-small text-text-muted hover:text-text"
        >
          Xoá lọc
        </button>
      )}
    </div>
  );
};
