import Dashboard from '@/components/kokonutui/dashboard.tsx';
import { useUserStore } from '@/stores/useUserStore.ts';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/dashboard/')({
  component: HomeDashboard,
});
export function HomeDashboard() {
  const { user } = useUserStore();
  return (
    <>
      <h1 className="text-3xl font-semibold pb-6">
        Welcome
        {' '}

        {user?.username}
      </h1>

      <Dashboard user={user!} />
    </>
  );
}
