import { create } from 'zustand';

export interface TaskTimerSession {
  taskId: number;
  title: string;
  minutes: number;
  /**
   * Set only when shown via Document Picture-in-Picture (`requestWindow()`
   * already called by `useStartTask` before this reaches the store) — a
   * real, always-on-top OS window that stays visible across tab switches,
   * unlike anything confined to one tab's DOM.
   * Absent → `TaskTimerFloatingPanel` renders it in-page instead (browsers
   * without the API — Firefox/Safari, or an older Chrome).
   */
  pipWindow?: Window;
}

interface TaskTimerState {
  session: TaskTimerSession | null;
  openSession: (session: TaskTimerSession) => void;
  closeSession: () => void;
}

/**
 * Single active countdown timer, shared across the whole app (not per-page)
 * — its host component is mounted once at the app root so it keeps running
 * as the user navigates the SPA underneath it. Starting a new timer while
 * one is open replaces it; this app supports one focus timer at a time, not
 * a stack of them.
 */
export const useTaskTimerStore = create<TaskTimerState>((set, get) => ({
  session: null,

  openSession: (session) => {
    // Replacing an existing PiP session — close its window first, or it leaks.
    get().session?.pipWindow?.close();
    set({ session });
  },

  closeSession: () => set({ session: null }),
}));
