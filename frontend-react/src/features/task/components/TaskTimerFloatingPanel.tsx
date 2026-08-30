import { useEffect, useRef, useState } from 'react';
import { GripHorizontal, X } from 'lucide-react';
import { useTaskTimerStore } from '../stores/taskTimer.store';
import { TaskTimerClock } from './TaskTimerClock';

const PANEL_WIDTH = 260;
const PANEL_HEIGHT = 280; // rough — just enough to keep the drag clamp sane, doesn't need to be exact
const MARGIN = 16;

/**
 * Mounted once at the app root (`App.tsx`) — the **fallback** for browsers
 * without Document Picture-in-Picture (`TaskTimerPipHost` handles that
 * preferred path). Renders nothing when the active session has a
 * `pipWindow` — only an in-page session (no separate window at all) shows
 * here. An in-page `position: fixed` card has zero window chrome (no
 * "localhost:5173" bar to fight, unlike any real window), but it's part of
 * this one tab's DOM: switch tabs and it's gone from view until you switch
 * back, unlike a real always-on-top window.
 */
export const TaskTimerFloatingPanel = () => {
  const session = useTaskTimerStore((s) => s.session);
  const closeSession = useTaskTimerStore((s) => s.closeSession);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  const isInPageSession = !!session && !session.pipWindow;

  // New in-page session — drop the panel in the bottom-right corner. Reset so
  // the next timer doesn't inherit a stale drag position from a previous one.
  useEffect(() => {
    if (isInPageSession) {
      setPosition({
        x: Math.max(MARGIN, window.innerWidth - PANEL_WIDTH - MARGIN),
        y: Math.max(MARGIN, window.innerHeight - PANEL_HEIGHT - MARGIN),
      });
    } else {
      setPosition(null);
    }
  }, [isInPageSession]);

  const clamp = (x: number, y: number) => ({
    x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - PANEL_WIDTH)),
    y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - PANEL_HEIGHT)),
  });

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!position) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
  };

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setPosition(clamp(drag.originX + (e.clientX - drag.startX), drag.originY + (e.clientY - drag.startY)));
  };

  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  if (!isInPageSession || !session || !position) return null;

  return (
    <div
      className="fixed z-[70] w-[260px] overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        className="flex touch-none items-center justify-between border-b border-border bg-background px-2 py-1 cursor-grab active:cursor-grabbing"
      >
        <GripHorizontal className="h-4 w-4 text-text-muted" />
        <button
          type="button"
          onClick={closeSession}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Đóng"
          className="rounded p-0.5 text-text-muted hover:bg-border hover:text-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <TaskTimerClock title={session.title} minutes={session.minutes} />
    </div>
  );
};
