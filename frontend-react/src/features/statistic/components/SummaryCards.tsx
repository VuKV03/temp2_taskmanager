import type { StatsTotals } from '../types/statistic.types';

interface SummaryCardsProps {
  totals: StatsTotals;
}

export const SummaryCards = ({ totals }: SummaryCardsProps) => {
  const cards = [
    { label: 'Đã tạo', value: totals.created },
    { label: 'Hoàn tất', value: totals.completed },
    { label: 'Quá hạn', value: totals.overdue },
    { label: 'Tỉ lệ HT', value: `${Math.round(totals.completionRate * 100)}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border bg-surface p-4">
          <p className="text-h2 font-heading font-semibold text-text">{card.value}</p>
          <p className="text-small text-text-muted">{card.label}</p>
        </div>
      ))}
    </div>
  );
};
