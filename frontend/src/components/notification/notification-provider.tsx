import type {
  Notification,
  NotificationAction,
  NotificationPreferences,
  NotificationPriority,
} from '@/types/notification.ts';
import type { ServerNotification, ServerNotificationEvents } from '@/types/types.ts';
import type { ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useWebSocket } from '@/hooks/use-websocket';
import { DEFAULT_PREFERENCES, NotificationContext } from '@/types/notification.ts';
import { useCallback, useEffect, useRef, useState } from 'react';

export function NotificationProvider({ children }: { children: ReactNode }) {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  const playSound = useCallback((type: ServerNotificationEvents) => {
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
  }, [preferences.doNotDisturb, preferences.doNotDisturbEnd, preferences.doNotDisturbStart, preferences.soundEnabled]);

  const addNotification = useCallback((notification: Notification) => {
    if (!preferences.enabledTypes[notification.event as ServerNotificationEvents]) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
    };

    console.info('New notification being added', newNotification);
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
    playSound(notification.type as ServerNotificationEvents);
  }, [playSound, preferences.enabledTypes]);

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
  const getPriorityForType = (type: ServerNotificationEvents): NotificationPriority => {
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
  const getDefaultActionsForType = (type: ServerNotificationEvents): NotificationAction[] => {
    switch (type) {
      case 'account_expired':
        return [{ label: 'Renew Account', href: '/accounts/renew' }];
      case 'membership_ending':
        return [{ label: 'Extend Subscription', href: '/subscription/extend' }];
      case 'account_expiring':
        return [{ label: 'View Account', href: '/accounts' }];
      case 'membership_paid':
        return [{ label: 'View Receipt', href: '/payments/receipts' }];
      case 'system_message':
        return [{ label: 'Learn More', href: '/announcements' }];
      default:
        return [];
    }
  };
  const handleWebSocketNotification = useCallback(
    (notification: ServerNotification) => {
      const newNotification: Notification = {
        id: notification.id,
        documentId: notification.documentId,
        event: notification.event,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        isSeen: false,
        priority: getPriorityForType(notification.event),
        actions: getDefaultActionsForType(notification.event),
        metadata: notification.metadata || {},
      };

      addNotification(newNotification);

      // Play sound for account_expired notifications
      if (notification.event === 'account_expired' && preferences.soundEnabled) {
        playSound('account_expired');
      }
    },
    [addNotification, playSound, preferences.soundEnabled],
  );
  // WebSocket integration
  useWebSocket({
    url: import.meta.env.VITE_API_URL || 'http:localhost:1337',
    onMessage: (message) => {
      try {
        if (message.type === 'notification') {
          handleWebSocketNotification(message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    },
  });

  useEffect(() => {
    const unreadNotifications = notifications.filter(notification => !notification.read);
    setHasUnread(unreadNotifications.length > 0);
    setUnreadCount(unreadNotifications.length);
  }, [notifications]);

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
