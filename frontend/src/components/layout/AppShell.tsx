import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <main className="mx-auto max-w-md min-h-screen pb-safe">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
