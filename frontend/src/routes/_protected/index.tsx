import { HomeDashboard } from '@/components/HomeDashboard';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/')({
  component: () => <HomeDashboard />,
});
