import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';
import { Input, Select } from '../../../shared/components/ui';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useTags } from '../hooks/useTags';
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from '../types/task.types';
import type { TaskStatus, TaskPriority } from '../types/task.types';

const STATUS_OPTIONS = Object.keys(TASK_STATUS_LABEL) as TaskStatus[];
const PRIORITY_OPTIONS = Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[];

function toggleInList(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

export const TaskFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tags } = useTags();

  const status = searchParams.get('status')?.split(',').filter(Boolean) ?? [];
  const priority = searchParams.get('priority')?.split(',').filter(Boolean) ?? [];
  const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean) ?? [];

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

  const hasFilters = status.length > 0 || priority.length > 0 || tagIds.length > 0 || !!q;

  const clearAll = () => {
    setQ('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ['status', 'priority', 'tagIds', 'q', 'page'].forEach((k) => next.delete(k));
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

      <div className="flex flex-wrap gap-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => updateListParam('status', toggleInList(status, s))}
            className={`rounded-full border px-3 py-1 text-small ${
              status.includes(s) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted'
            }`}
          >
            {TASK_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {PRIORITY_OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => updateListParam('priority', toggleInList(priority, p))}
            className={`rounded-full border px-3 py-1 text-small ${
              priority.includes(p) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted'
            }`}
          >
            {TASK_PRIORITY_LABEL[p]}
          </button>
        ))}
      </div>

      {tags && tags.length > 0 && (
        <Select
          className="w-36"
          value=""
          onChange={(e) => {
            if (e.target.value) updateListParam('tagIds', toggleInList(tagIds, e.target.value));
          }}
          aria-label="Lọc theo nhãn"
        >
          <option value="">Nhãn ▾</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tagIds.includes(String(tag.id)) ? '✓ ' : ''}
              {tag.name}
            </option>
          ))}
        </Select>
      )}

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
