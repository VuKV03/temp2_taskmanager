import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Short two-beep alert on completion — generated, not fetched (no external CDN needed). */
function playBeep(ctxWindow: Window) {
  try {
    const AudioCtx = (ctxWindow as unknown as { AudioContext: typeof AudioContext }).AudioContext;
    const ctx = new AudioCtx();
    [0, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
  } catch {
    // Web Audio unavailable (e.g. autoplay policy) — the visual "Hết giờ!" state still shows.
  }
}

interface TaskTimerClockProps {
  title: string;
  minutes: number;
  /** The `Window` this clock actually renders in — a Document PiP window has its own, separate `window`/`document`; `setInterval`/`document.title`/`AudioContext` must target that one, not the opener's. Defaults to the current `window` (in-page panel). */
  hostWindow?: Window;
}

/**
 * Pure countdown UI — reused by `TaskTimerFloatingPanel` (in-page, same
 * window) and `TaskTimerPipHost` (Document Picture-in-Picture, a different
 * `hostWindow`) so the two only ever differ in *where* this renders.
 */
export const TaskTimerClock = ({ title, minutes, hostWindow }: TaskTimerClockProps) => {
  const win = hostWindow ?? window;
  const totalSeconds = Math.max(1, minutes) * 60;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const hasBeeped = useRef(false);

  useEffect(() => {
    win.document.title = `${formatClock(remaining)} · ${title}`;
  }, [remaining, title, win]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timer = win.setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => win.clearInterval(timer);
  }, [running, remaining, win]);

  useEffect(() => {
    if (remaining === 0 && !hasBeeped.current) {
      hasBeeped.current = true;
      setRunning(false);
      playBeep(win);
    }
  }, [remaining, win]);

  const isDone = remaining === 0;
  const progress = 1 - remaining / totalSeconds;

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4 text-center">
      <p className="max-w-full truncate text-small font-medium text-text" title={title}>
        {title}
      </p>

      <div
        className="relative flex h-28 w-28 items-center justify-center rounded-full border-[6px] transition-colors"
        style={{ borderColor: isDone ? 'var(--color-priority-urgent)' : 'var(--color-primary)' }}
      >
        <span className={`text-xl font-bold tabular-nums ${isDone ? 'text-red-600' : 'text-text'}`}>
          {formatClock(remaining)}
        </span>
      </div>

      {isDone ? (
        <p className="text-small font-semibold text-red-600">⏰ Hết giờ!</p>
      ) : (
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {!isDone && (
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-small font-medium text-white hover:bg-primary-hover"
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? 'Tạm dừng' : 'Tiếp tục'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            hasBeeped.current = false;
            setRemaining(totalSeconds);
            setRunning(true);
          }}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-small text-text hover:bg-background"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Đặt lại
        </button>
      </div>
    </div>
  );
};
