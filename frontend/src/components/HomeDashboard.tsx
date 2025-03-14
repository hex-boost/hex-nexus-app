import { useUserStore } from '@/stores/useUserStore';
import Dashboard from './kokonutui/dashboard';

export function HomeDashboard() {
  const { user } = useUserStore();
  return (
    <>
      <h1 className="text-5xl mb-6 pt-12">
        Welcome back
        {' '}

        {user.username}
      </h1>
      <Dashboard />
    </>
  );
}
