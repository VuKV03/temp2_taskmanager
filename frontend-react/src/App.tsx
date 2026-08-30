import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { queryClient } from './shared/lib/queryClient';
import { router } from './routes';
import { useAuthBootstrap } from './features/auth';
import { TaskTimerFloatingPanel, TaskTimerPipHost } from './features/task';

function App() {
  useAuthBootstrap();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
      {/* Countdown timer host (see useStartTask) — mounted once so it survives SPA navigation.
          Exactly one of these two actually renders anything, depending on whether the
          active session is a Document PiP window or an in-page fallback. */}
      <TaskTimerPipHost />
      <TaskTimerFloatingPanel />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
