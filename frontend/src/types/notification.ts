import type { ServerNotification, ServerNotificationEvents } from '@/types/types.ts';
import { createContext } from 'react';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type NotificationAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type Notification = ServerNotification & {
  priority: NotificationPriority;
  action?: NotificationAction;
};
export type NotificationPreferences = {
  enabledTypes: Record<ServerNotificationEvents, boolean>;
  doNotDisturb: boolean;
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
  soundEnabled: boolean;
  emailEnabled: boolean;
};

type NotificationContextType = {
  notifications: Notification[];
  hasUnread: boolean;
  unreadCount: number;
  preferences: NotificationPreferences;
  setPreferences: (prefs: NotificationPreferences) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  playSound: (type: ServerNotificationEvents) => void;
  filterType: 'all' | 'unread' | 'read';
  setFilterType: (type: 'all' | 'unread' | 'read') => void;
};

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabledTypes: {
    account_rented: true,
    new_update: true,
    membership_ended: true,
    membership_ending: true,
    membership_paid: true,
    account_expired: true,
    account_expiring: true,
    system_message: true,
  },
  doNotDisturb: false,
  soundEnabled: true,
  emailEnabled: false,
};

// Sample notifications for demonstration
export const SAMPLE_NOTIFICATIONS: any[] = [
  {
    id: 1,
    event: 'account_expired',
    title: 'Account Expired',
    message: 'Your League of Legends account \'SummonerKing123\' has expired. Renew now to continue using it.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    publishedAt: new Date(Date.now() - 1000 * 60 * 30),
    isSeen: false,
    priority: 'high',
    action:
      {
        label: 'Renew Account',
        href: '/accounts/renew/SummonerKing123',
      },

    metadata: {
      accountId: 'SummonerKing123',
      expiredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    user: { id: 1 }, // Example user relation
  },
  {
    id: 2,
    event: 'membership_ending',
    title: 'Subscription Expiring Soon',
    message: 'Your premium subscription will expire in 3 days. Extend now to avoid interruption.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isSeen: false,
    priority: 'medium',
    action:
      {
        label: 'Extend Subscription',
        href: '/subscription/extend',
      },
    metadata: {
      subscriptionId: 'premium-monthly',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    user: { id: 1 },
  },
  {
    id: 3,
    event: 'membership_paid',
    title: 'Payment Successful',
    message: 'Your monthly subscription payment of $19.99 was successfully processed.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isSeen: true,
    priority: 'low',
    action:
      {
        label: 'View Receipt',
        href: '/payments/receipt/INV-2023-1234',
      },
    metadata: {
      amount: 19.99,
      currency: 'USD',
      paymentMethod: 'Visa ending in 4242',
      invoiceId: 'INV-2023-1234',
    },
    user: { id: 1 },
  },
  {
    id: 4,
    event: 'account_expiring',
    title: 'Account Expiring Soon',
    message: 'Your League of Legends account \'DragonSlayer99\' will expire in 2 days.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    isSeen: true,
    priority: 'medium',
    action:
      {
        label: 'View Account',
        href: '/accounts/DragonSlayer99',
      },
    metadata: {
      accountId: 'DragonSlayer99',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    user: { id: 1 } as any,
    documentId: '',
  },
  {
    id: 5,
    event: 'system_message',
    title: 'Maintenance Scheduled',
    message: 'We\'ll be performing system maintenance on June 15th from 2-4 AM UTC. Service may be temporarily unavailable.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    isSeen: true,
    priority: 'low',
    action:
      {
        label: 'Learn More',
        href: '/announcements/maintenance-june-15',
      },
    metadata: {
      maintenanceStart: '2023-06-15T02:00:00Z',
      maintenanceEnd: '2023-06-15T04:00:00Z',
      affectedServices: ['account-rental', 'payment-processing'],
    },
    user: { id: 1 },
  },
];
