import { NotificationContext } from '@/features/notification/types/notification.ts';
import { use } from 'react';

export function useNotifications() {
  const context = use(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
