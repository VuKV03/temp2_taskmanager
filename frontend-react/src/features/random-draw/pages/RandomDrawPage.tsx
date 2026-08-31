import { useState } from 'react';
import { Dice5, Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui';
import { DrawSessionListPanel } from '../components/DrawSessionListPanel';
import { DrawSessionDetail } from '../components/DrawSessionDetail';
import { CreateDrawSessionModal } from '../components/CreateDrawSessionModal';

export const RandomDrawPage = () => {
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dice5 className="h-5 w-5 text-text-muted" />
          <h1>Bốc thăm công việc</h1>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Phiên mới
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <DrawSessionListPanel selectedId={selectedId} onSelect={setSelectedId} />

        <div>
          {selectedId === undefined ? (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-body text-text-muted">
              Chọn một phiên ở bên trái, hoặc tạo phiên mới để bắt đầu.
            </div>
          ) : (
            <DrawSessionDetail sessionId={selectedId} onDeleted={() => setSelectedId(undefined)} />
          )}
        </div>
      </div>

      <CreateDrawSessionModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={setSelectedId} />
    </div>
  );
};
