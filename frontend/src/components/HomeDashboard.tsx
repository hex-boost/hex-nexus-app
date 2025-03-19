import { useUserStore } from '@/stores/useUserStore';
import Dashboard from './kokonutui/dashboard';

export function HomeDashboard() {
  const { user } = useUserStore();
  return (
    <>
      <h1 className="text-4xl font-semibold pt-12 pb-6">
        Welcome
        {' '}

        {user?.username}
      </h1>
      <Dashboard />
    </>
  );
}
