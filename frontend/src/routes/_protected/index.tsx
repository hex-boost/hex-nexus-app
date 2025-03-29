import { HomeDashboard } from '@/components/HomeDashboard';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated()) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: () => <HomeDashboard />,
});
