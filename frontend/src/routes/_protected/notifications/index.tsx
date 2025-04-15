import { NotificationHistory } from '@/components/notification/notification-history.tsx';
import { NotificationProvider } from '@/components/notification/notification-provider.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/notifications/')({
  component: NotificationPage,
});
function NotificationPage() {
  return (
    <NotificationProvider>
      <NotificationHistory />

    </NotificationProvider>
  );
}
