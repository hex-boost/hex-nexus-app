import { useUserStore } from '@/stores/useUserStore.ts';
import Dashboard from './kokonutui/dashboard';

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
