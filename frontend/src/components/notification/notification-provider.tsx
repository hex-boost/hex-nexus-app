import type { ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useWebSocket } from '@/hooks/use-websocket';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type NotificationType =
  | 'account_expired'
  | 'subscription_expiring'
  | 'subscription_paid'
  | 'account_expiring'
  | 'system_message';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type NotificationAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: NotificationPriority;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
};

export type NotificationPreferences = {
  enabledTypes: Record<NotificationType, boolean>;
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
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  playSound: (type: NotificationType) => void;
  filterType: 'all' | 'unread' | 'read';
  setFilterType: (type: 'all' | 'unread' | 'read') => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabledTypes: {
    account_expired: true,
    subscription_expiring: true,
    subscription_paid: true,
    account_expiring: true,
    system_message: true,
  },
  doNotDisturb: false,
  soundEnabled: true,
  emailEnabled: false,
};

// Sample notifications for demonstration
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'account_expired',
    title: 'Account Expired',
    message: 'Your League of Legends account \'SummonerKing123\' has expired. Renew now to continue using it.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    priority: 'high',
    actions: [
      {
        label: 'Renew Account',
        href: '/accounts/renew/SummonerKing123',
      },
    ],
    metadata: {
      accountId: 'SummonerKing123',
      expiredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  },
  {
    id: '2',
    type: 'subscription_expiring',
    title: 'Subscription Expiring Soon',
    message: 'Your premium subscription will expire in 3 days. Extend now to avoid interruption.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    priority: 'medium',
    actions: [
      {
        label: 'Extend Subscription',
        href: '/subscription/extend',
      },
    ],
    metadata: {
      subscriptionId: 'premium-monthly',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
  },
  {
    id: '3',
    type: 'subscription_paid',
    title: 'Payment Successful',
    message: 'Your monthly subscription payment of $19.99 was successfully processed.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    priority: 'low',
    actions: [
      {
        label: 'View Receipt',
        href: '/payments/receipt/INV-2023-1234',
      },
    ],
    metadata: {
      amount: 19.99,
      currency: 'USD',
      paymentMethod: 'Visa ending in 4242',
      invoiceId: 'INV-2023-1234',
    },
  },
  {
    id: '4',
    type: 'account_expiring',
    title: 'Account Expiring Soon',
    message: 'Your League of Legends account \'DragonSlayer99\' will expire in 2 days.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    read: true,
    priority: 'medium',
    actions: [
      {
        label: 'View Account',
        href: '/accounts/DragonSlayer99',
      },
      {
        label: 'Extend Rental',
        href: '/accounts/extend/DragonSlayer99',
      },
    ],
    metadata: {
      accountId: 'DragonSlayer99',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  },
  {
    id: '5',
    type: 'system_message',
    title: 'Maintenance Scheduled',
    message:
      'We\'ll be performing system maintenance on June 15th from 2-4 AM UTC. Service may be temporarily unavailable.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    read: true,
    priority: 'low',
    actions: [
      {
        label: 'Learn More',
        href: '/announcements/maintenance-june-15',
      },
    ],
    metadata: {
      maintenanceStart: '2023-06-15T02:00:00Z',
      maintenanceEnd: '2023-06-15T04:00:00Z',
      affectedServices: ['account-rental', 'payment-processing'],
    },
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  // State
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');

  // Local storage for preferences
  const [preferences, setPreferences] = useLocalStorage<NotificationPreferences>(
    'notification-preferences',
    DEFAULT_PREFERENCES,
  );

  // Audio refs for notification sounds
  const accountExpiredSound = useRef<HTMLAudioElement | null>(null);
  const generalNotificationSound = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    accountExpiredSound.current = new Audio('/sounds/account-expired.mp3');
    generalNotificationSound.current = new Audio('/sounds/notification.mp3');

    return () => {
      accountExpiredSound.current = null;
      generalNotificationSound.current = null;
    };
  }, []);

  // WebSocket integration
  const { lastMessage } = useWebSocket({
    url: import.meta.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://api.example.com/notifications',
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'notification') {
          handleWebSocketNotification(data.notification);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    },
  });

  // Handle incoming WebSocket notifications
  const handleWebSocketNotification = useCallback(
    (notification: any) => {
      const newNotification: Notification = {
        id: notification.id || Date.now().toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false,
        priority: notification.priority || getPriorityForType(notification.type),
        actions: notification.actions || getDefaultActionsForType(notification.type),
        metadata: notification.metadata || {},
      };

      addNotification(newNotification);

      // Play sound for account_expired notifications
      if (notification.type === 'account_expired' && preferences.soundEnabled) {
        playSound('account_expired');
      }
    },
    [preferences.soundEnabled],
  );

  // Check for unread notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(notification => !notification.read);
    setHasUnread(unreadNotifications.length > 0);
    setUnreadCount(unreadNotifications.length);
  }, [notifications]);

  // Play notification sound
  const playSound = (type: NotificationType) => {
    if (!preferences.soundEnabled) {
      return;
    }

    // Check if in Do Not Disturb mode
    if (preferences.doNotDisturb) {
      const now = new Date();
      const currentHour = now.getHours();

      if (preferences.doNotDisturbStart && preferences.doNotDisturbEnd) {
        const startHour = Number.parseInt(preferences.doNotDisturbStart.split(':')[0]);
        const endHour = Number.parseInt(preferences.doNotDisturbEnd.split(':')[0]);

        if (
          (startHour < endHour && currentHour >= startHour && currentHour < endHour)
          || (startHour > endHour && (currentHour >= startHour || currentHour < endHour))
        ) {
          return; // In DND period, don't play sound
        }
      }
    }

    if (type === 'account_expired' && accountExpiredSound.current) {
      accountExpiredSound.current.play();
    } else if (generalNotificationSound.current) {
      generalNotificationSound.current.play();
    }
  };

  // Helper function to get priority based on notification type
  const getPriorityForType = (type: NotificationType): NotificationPriority => {
    switch (type) {
      case 'account_expired':
        return 'high';
      case 'subscription_expiring':
      case 'account_expiring':
        return 'medium';
      default:
        return 'low';
    }
  };

  // Helper function to get default actions based on notification type
  const getDefaultActionsForType = (type: NotificationType): NotificationAction[] => {
    switch (type) {
      case 'account_expired':
        return [{ label: 'Renew Account', href: '/accounts/renew' }];
      case 'subscription_expiring':
        return [{ label: 'Extend Subscription', href: '/subscription/extend' }];
      case 'account_expiring':
        return [{ label: 'View Account', href: '/accounts' }];
      case 'subscription_paid':
        return [{ label: 'View Receipt', href: '/payments/receipts' }];
      case 'system_message':
        return [{ label: 'Learn More', href: '/announcements' }];
      default:
        return [];
    }
  };

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Check if notification type is enabled in preferences
    if (!preferences.enabledTypes[notification.type as NotificationType]) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: notification.id || Date.now().toString(),
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => {
      // Sort by priority and timestamp
      const updated = [newNotification, ...prev];
      return updated.sort((a, b) => {
        // First sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        // Then by read status (unread first)
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }

        // Finally by timestamp (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    });

    // Play sound based on notification type
    playSound(notification.type as NotificationType);
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification => (notification.id === id ? { ...notification, read: true } : notification)),
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext
      value={{
        notifications,
        hasUnread,
        unreadCount,
        preferences,
        setPreferences,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        isDropdownOpen,
        setIsDropdownOpen,
        playSound,
        filterType,
        setFilterType,
      }}
    >
      {children}
    </NotificationContext>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
