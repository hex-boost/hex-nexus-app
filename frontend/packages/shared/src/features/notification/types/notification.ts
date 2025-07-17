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
  soundEnabled: boolean;
  emailEnabled: boolean;
};

type NotificationContextType = {
  notifications: ServerNotification[];
  hasUnread: boolean;
  unreadCount: number;
  preferences: NotificationPreferences;
  setPreferences: (prefs: NotificationPreferences) => void;
  addNotification: (notification: ServerNotification) => void;
  removeNotification: (documentId: string) => void;
  markAsRead: (documentId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  playSound: (type: ServerNotificationEvents) => void;
  filterType: 'all' | 'unread' | 'read';
  setFilterType: (type: 'all' | 'unread' | 'read') => void;
};

export const NOTIFICATION_EVENTS = {
  SYSTEM_MESSAGE: 'system_message',
  MEMBERSHIP_ENDING: 'membership_ending',
  MEMBERSHIP_ENDED: 'membership_ended',
  MEMBERSHIP_PAID: 'membership_paid',
  ACCOUNT_EXPIRING: 'account_expiring',
  ACCOUNT_EXPIRED: 'account_expired',
  ACCOUNT_RENTED: 'account_rented',
  NEW_UPDATE: 'new_update',
} as const;
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabledTypes: {
    budget_restart: true,
    account_rented: true,
    new_update: true,
    membership_ended: true,
    membership_ending: true,
    membership_paid: true,
    account_expired: true,
    account_expiring: true,
    system_message: true,
  },
  soundEnabled: true,
  emailEnabled: false,
};
