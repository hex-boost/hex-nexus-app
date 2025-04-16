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
  actions?: NotificationAction[];
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
// const SAMPLE_NOTIFICATIONS: Notification[] = [
//   {
//     id: '1',
//     type: 'account_expired',
//     title: 'Account Expired',
//     message: 'Your League of Legends account \'SummonerKing123\' has expired. Renew now to continue using it.',
//     timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
//     read: false,
//     priority: 'high',
//     actions: [
//       {
//         label: 'Renew Account',
//         href: '/accounts/renew/SummonerKing123',
//       },
//     ],
//     metadata: {
//       accountId: 'SummonerKing123',
//       expiredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//     },
//   },
//   {
//     id: '2',
//     type: 'subscription_expiring',
//     title: 'Subscription Expiring Soon',
//     message: 'Your premium subscription will expire in 3 days. Extend now to avoid interruption.',
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
//     read: false,
//     priority: 'medium',
//     actions: [
//       {
//         label: 'Extend Subscription',
//         href: '/subscription/extend',
//       },
//     ],
//     metadata: {
//       subscriptionId: 'premium-monthly',
//       expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
//     },
//   },
//   {
//     id: '3',
//     type: 'subscription_paid',
//     title: 'Payment Successful',
//     message: 'Your monthly subscription payment of $19.99 was successfully processed.',
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
//     read: true,
//     priority: 'low',
//     actions: [
//       {
//         label: 'View Receipt',
//         href: '/payments/receipt/INV-2023-1234',
//       },
//     ],
//     metadata: {
//       amount: 19.99,
//       currency: 'USD',
//       paymentMethod: 'Visa ending in 4242',
//       invoiceId: 'INV-2023-1234',
//     },
//   },
//   {
//     id: '4',
//     type: 'account_expiring',
//     title: 'Account Expiring Soon',
//     message: 'Your League of Legends account \'DragonSlayer99\' will expire in 2 days.',
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
//     read: true,
//     priority: 'medium',
//     actions: [
//       {
//         label: 'View Account',
//         href: '/accounts/DragonSlayer99',
//       },
//       {
//         label: 'Extend Rental',
//         href: '/accounts/extend/DragonSlayer99',
//       },
//     ],
//     metadata: {
//       accountId: 'DragonSlayer99',
//       expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
//     },
//   },
//   {
//     id: '5',
//     type: 'system_message',
//     title: 'Maintenance Scheduled',
//     message:
//       'We\'ll be performing system maintenance on June 15th from 2-4 AM UTC. Service may be temporarily unavailable.',
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
//     read: true,
//     priority: 'low',
//     actions: [
//       {
//         label: 'Learn More',
//         href: '/announcements/maintenance-june-15',
//       },
//     ],
//     metadata: {
//       maintenanceStart: '2023-06-15T02:00:00Z',
//       maintenanceEnd: '2023-06-15T04:00:00Z',
//       affectedServices: ['account-rental', 'payment-processing'],
//     },
//   },
// ];
