import { HomeDashboard } from '@/components/HomeDashboard.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/dashboard/')({
  component: HomeDashboard,
});
