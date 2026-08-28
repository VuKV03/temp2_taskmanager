import { useSearchParams } from 'react-router';
import { Input } from '../../../shared/components/ui';

/** Date range synced to URL params (`from`/`to`) — shareable link, F5-safe, per FE-PROJECT-RULES.md. */
export const DateRangePicker = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const setParam = (key: 'from' | 'to', value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input type="date" value={from} onChange={(e) => setParam('from', e.target.value)} className="w-40" aria-label="Từ ngày" />
      <span className="text-text-muted">–</span>
      <Input type="date" value={to} onChange={(e) => setParam('to', e.target.value)} className="w-40" aria-label="Đến ngày" />
    </div>
  );
};
