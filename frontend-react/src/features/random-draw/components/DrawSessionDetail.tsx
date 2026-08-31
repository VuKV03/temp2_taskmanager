import { useState } from 'react';
import { Sparkles, Trash2, Pencil, X, Dice5 } from 'lucide-react';
import { Skeleton, ErrorState } from '../../../shared/components/feedback';
import { Button, Input, Label, Badge, ConfirmDialog } from '../../../shared/components/ui';
import { useDrawSession } from '../hooks/useDrawSession';
import { useDraw } from '../hooks/useDraw';
import { useDeleteDrawSession } from '../hooks/useDeleteDrawSession';
import { useUpdateDrawSession } from '../hooks/useUpdateDrawSession';
import { EditDrawSessionModal } from './EditDrawSessionModal';
import type { DrawItem } from '../types/random-draw.types';

interface DrawSessionDetailProps {
  sessionId: number;
  onDeleted: () => void;
}

const groupByRound = (items: DrawItem[]): Map<number, DrawItem[]> => {
  const rounds = new Map<number, DrawItem[]>();
  for (const item of items) {
    if (!item.isDrawn || item.roundNumber === null) continue;
    const group = rounds.get(item.roundNumber) ?? [];
    group.push(item);
    rounds.set(item.roundNumber, group);
  }
  return rounds;
};

export const DrawSessionDetail = ({ sessionId, onDeleted }: DrawSessionDetailProps) => {
  const { data: session, isLoading, isError, refetch } = useDrawSession(sessionId);
  const { mutate: draw, isPending: isDrawing } = useDraw(sessionId);
  const { mutate: remove, isPending: isDeleting } = useDeleteDrawSession();
  const { mutate: update } = useUpdateDrawSession(sessionId);
  const [count, setCount] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !session) {
    return <ErrorState description="Không tải được phiên bốc thăm." onRetry={() => refetch()} />;
  }

  const rounds = groupByRound(session.items);
  const latestRound = rounds.size > 0 ? Math.max(...rounds.keys()) : null;
  const pending = session.items.filter((i) => !i.isDrawn);
  const isCompleted = session.status === 'completed';
  const progressPct = session.totalCount === 0 ? 0 : Math.round(((session.totalCount - session.remainingCount) / session.totalCount) * 100);

  const handleDraw = () => {
    const clamped = Math.max(1, Math.min(count, session.remainingCount));
    draw(clamped);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-h2 font-heading text-text">{session.name}</h2>
          <p className="mt-0.5 text-small text-text-muted">
            {session.sourceType === 'task_list' ? 'Nguồn: danh sách công việc có sẵn' : 'Nguồn: nhập tay'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            style={{
              backgroundColor: isCompleted ? 'var(--color-status-done)' : 'var(--color-status-in-progress)',
              color: isCompleted ? 'var(--color-status-done-text)' : 'var(--color-status-in-progress-text)',
            }}
          >
            {isCompleted ? 'Đã bốc hết' : 'Đang hoạt động'}
          </Badge>
          <button
            aria-label="Sửa phiên"
            onClick={() => setEditOpen(true)}
            className="rounded p-1.5 text-text-muted hover:bg-background hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            aria-label="Xoá phiên"
            onClick={() => setConfirmDelete(true)}
            className="rounded p-1.5 text-text-muted hover:bg-background hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-body text-text">
          <span>
            Còn lại <span className="font-semibold">{session.remainingCount}</span> / {session.totalCount}
          </span>
          <span className="text-small text-text-muted">{progressPct}% đã bốc</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-background">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        {!isCompleted && (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="draw-count">Số lượng bốc</Label>
              <Input
                id="draw-count"
                type="number"
                min={1}
                max={session.remainingCount}
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 1)}
                className="w-28"
              />
            </div>
            <Button onClick={handleDraw} isLoading={isDrawing} disabled={session.remainingCount === 0}>
              <Dice5 className="mr-1.5 h-4 w-4" />
              Bốc ngay
            </Button>
          </div>
        )}
        {isCompleted && (
          <p className="mt-4 text-small text-text-muted">
            Ngân hàng công việc đã hết — mọi công việc đều đã được bốc.
          </p>
        )}
      </div>

      {latestRound !== null && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-body font-semibold text-text">
            <Sparkles className="h-4 w-4 text-primary" />
            Kết quả vừa bốc — Vòng {latestRound}
          </h3>
          <div className="flex flex-wrap gap-2">
            {rounds.get(latestRound)!.map((item) => (
              <Badge key={item.id} className="bg-primary/15 text-primary">
                {item.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {rounds.size > 1 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-3 text-body font-semibold text-text">Lịch sử các vòng bốc</h3>
          <div className="space-y-3">
            {[...rounds.keys()]
              .sort((a, b) => b - a)
              .filter((round) => round !== latestRound)
              .map((round) => (
                <div key={round}>
                  <p className="mb-1 text-small font-medium text-text-muted">Vòng {round}</p>
                  <div className="flex flex-wrap gap-2">
                    {rounds.get(round)!.map((item) => (
                      <Badge key={item.id}>{item.label}</Badge>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-3 text-body font-semibold text-text">Ngân hàng còn lại ({pending.length})</h3>
          <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
            {pending.map((item) => (
              <Badge key={item.id} className="bg-background text-text-muted">
                {item.label}
                <button
                  aria-label={`Bỏ "${item.label}" khỏi ngân hàng`}
                  onClick={() => update({ removeItemIds: [item.id] })}
                  className="rounded-full p-0.5 hover:bg-border hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <EditDrawSessionModal open={editOpen} onClose={() => setEditOpen(false)} session={session} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove(sessionId, { onSuccess: () => { setConfirmDelete(false); onDeleted(); } })}
        title="Xoá phiên bốc thăm?"
        description={`"${session.name}" sẽ bị xoá vĩnh viễn cùng toàn bộ lịch sử bốc. Các công việc gốc (nếu có) không bị ảnh hưởng.`}
        confirmLabel="Xoá"
        isLoading={isDeleting}
      />
    </div>
  );
};
