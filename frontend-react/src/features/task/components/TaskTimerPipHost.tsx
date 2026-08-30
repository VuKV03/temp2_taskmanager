import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTaskTimerStore } from '../stores/taskTimer.store';
import { TaskTimerClock } from './TaskTimerClock';

/** Copies the main document's stylesheets into the PiP window's separate `document` — it starts as a blank page with none of Tailwind's compiled CSS. */
function copyStylesInto(doc: Document) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const cssText = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join('\n');
      const style = doc.createElement('style');
      style.textContent = cssText;
      doc.head.appendChild(style);
    } catch {
      // Cross-origin stylesheet (cssRules throws) — link it instead of inlining.
      if (sheet.href) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        doc.head.appendChild(link);
      }
    }
  }
}

/**
 * Mounted once at the app root (`App.tsx`) — portals the active timer's UI
 * into its Document Picture-in-Picture window, when `useStartTask` opened
 * one (`session.pipWindow` set). Renders nothing when the active session is
 * an in-page one instead — `TaskTimerFloatingPanel` handles that case.
 */
export const TaskTimerPipHost = () => {
  const session = useTaskTimerStore((s) => s.session);
  const closeSession = useTaskTimerStore((s) => s.closeSession);
  const pipWindow = session?.pipWindow;

  useEffect(() => {
    if (!pipWindow) return;

    copyStylesInto(pipWindow.document);
    // Carry the current light/dark theme (`.dark` on <html>, see theme.store.ts)
    // into the PiP window — it's a separate document, styling doesn't cascade in.
    pipWindow.document.documentElement.className = document.documentElement.className;

    // The browser's own PiP chrome has a close control; this just keeps our
    // state in sync when the user (or `openSession` replacing it) closes it.
    const handlePageHide = () => closeSession();
    pipWindow.addEventListener('pagehide', handlePageHide);
    return () => pipWindow.removeEventListener('pagehide', handlePageHide);
  }, [pipWindow, closeSession]);

  if (!session || !pipWindow) return null;

  return createPortal(
    <TaskTimerClock title={session.title} minutes={session.minutes} hostWindow={pipWindow} />,
    pipWindow.document.body,
  );
};
