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
