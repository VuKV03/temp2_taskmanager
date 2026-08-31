import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';
import { Input, FilterDropdown, Select } from '../../../shared/components/ui';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useTags } from '../hooks/useTags';
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from '../types/task.types';
import type { TaskStatus, TaskPriority } from '../types/task.types';

// `value` packs `sort:order` into one <select> option so a single control
// covers both "khối lượng" and "mới nhất" — no reason to force two dropdowns
// for what's really one choice.
const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'createdAt:desc', label: 'Mới nhất' },
  { value: 'createdAt:asc', label: 'Cũ nhất' },
  { value: 'points:desc', label: 'Khối lượng: cao → thấp' },
  { value: 'points:asc', label: 'Khối lượng: thấp → cao' },
];

const STATUS_OPTIONS = (Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_LABEL[value],
}));
const PRIORITY_OPTIONS = (Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((value) => ({
  value,
  label: TASK_PRIORITY_LABEL[value],
}));

export const TaskFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tags } = useTags();

  const status = searchParams.get('status')?.split(',').filter(Boolean) ?? [];
  const priority = searchParams.get('priority')?.split(',').filter(Boolean) ?? [];
  const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean) ?? [];
  const sortValue = searchParams.get('sort') ? `${searchParams.get('sort')}:${searchParams.get('order') ?? 'desc'}` : '';

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const debouncedQ = useDebounce(q, 400);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedQ) next.set('q', debouncedQ);
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const updateListParam = (key: 'status' | 'priority' | 'tagIds', values: string[]) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (values.length > 0) next.set(key, values.join(','));
      else next.delete(key);
      next.delete('page');
      return next;
    });
  };

  const tagOptions = (tags ?? []).map((tag) => ({ value: String(tag.id), label: tag.name }));

  const hasFilters = status.length > 0 || priority.length > 0 || tagIds.length > 0 || !!q || !!sortValue;

  const setSort = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const [sort, order] = value.split(':');
      if (sort) {
        next.set('sort', sort);
        next.set('order', order);
      } else {
        next.delete('sort');
        next.delete('order');
      }
      next.delete('page');
      return next;
    });
  };

  const clearAll = () => {
    setQ('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ['status', 'priority', 'tagIds', 'q', 'sort', 'order', 'page'].forEach((k) => next.delete(k));
      return next;
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm công việc..."
          className="w-56 pl-9"
          aria-label="Tìm công việc"
        />
      </div>

      <FilterDropdown
        label="Trạng thái"
        options={STATUS_OPTIONS}
        selected={status}
        onChange={(values) => updateListParam('status', values)}
      />

      <FilterDropdown
        label="Độ ưu tiên"
        options={PRIORITY_OPTIONS}
        selected={priority}
        onChange={(values) => updateListParam('priority', values)}
      />

      {tagOptions.length > 0 && (
        <FilterDropdown
          label="Nhãn"
          options={tagOptions}
          selected={tagIds}
          onChange={(values) => updateListParam('tagIds', values)}
        />
      )}

      <Select
        value={sortValue}
        onChange={(e) => setSort(e.target.value)}
        className="h-9 w-44 py-0 text-small"
        aria-label="Sắp xếp"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 text-small text-text-muted hover:text-text"
        >
          <X className="h-3.5 w-3.5" />
          Xoá lọc
        </button>
      )}
    </div>
  );
};
