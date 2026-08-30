import { Outlet } from 'react-router';
import { Header } from '../shared/components/layout/Header';
import { TaskListSidebar } from '../features/task-list';

export const MainLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="p-4">
          <h1 className="text-lg font-heading font-semibold text-text">📋 Task Manager</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TaskListSidebar />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1200px] p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
