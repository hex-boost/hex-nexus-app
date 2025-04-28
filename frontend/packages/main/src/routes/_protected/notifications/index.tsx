import { NotificationHistory } from '@/features/notification/notification-history.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/notifications/')({
  component: NotificationPage,
});
function NotificationPage() {
  return (
    <NotificationHistory />

  );
}
