import type { Notification, NotificationPreferences, NotificationPriority } from '@/types/notification.ts';
import type { ServerNotification, ServerNotificationEvents } from '@/types/types.ts';
import type { ReactNode } from 'react';
import notificationSound from '@/assets/sounds/notification.ogg';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useWebSocket } from '@/hooks/use-websocket';
import { usePremiumPaymentModalStore } from '@/stores/usePremiumPaymentModalStore';
import { useUserStore } from '@/stores/useUserStore.ts';
import { DEFAULT_PREFERENCES, NOTIFICATION_EVENTS, NotificationContext } from '@/types/notification.ts';
import { Howl } from 'howler';
import { useCallback, useEffect, useRef, useState } from 'react';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useUserStore();
  const premiumModalStore = usePremiumPaymentModalStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [initialized, setInitialized] = useState(false);

  // Local storage for preferences
  const [preferences, setPreferences] = useLocalStorage<NotificationPreferences>(
    'notification-preferences',
    DEFAULT_PREFERENCES,
  );

  // Single audio ref for notification sound
  const notificationSoundRef = useRef<Howl | null>(null);

  // Initialize single Howl sound object
  useEffect(() => {
    notificationSoundRef.current = new Howl({
      src: [notificationSound],
      format: ['ogg'],
      volume: 0.5,
      preload: true,
    });

    return () => {
      // Clean up sound
      notificationSoundRef.current?.unload();
    };
  }, []);

  const playSound = useCallback(() => {
    if (!preferences.soundEnabled) {
      return;
    }

    // Play the notification sound
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play();
    }
  }, [preferences.soundEnabled]);

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
        if (a.isSeen !== b.isSeen) {
          return a.isSeen ? 1 : -1;
        }

        // Finally by timestamp (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });

    // Play notification sound
    playSound();
  }, [playSound, preferences.enabledTypes]);

  // Remove a notification
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification => (notification.id === id ? { ...notification, isSeen: true } : notification)),
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isSeen: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  const getPriorityForType = (type: ServerNotificationEvents): NotificationPriority => {
    switch (type) {
      case 'account_expired':
        return 'high';
      case 'membership_ending':
      case 'account_expiring':
        return 'medium';
      default:
        return 'low';
    }
  };

  const handleNotification = useCallback(
    (notification: ServerNotification) => {
      console.info('New notification received', notification.event, notification.title);
      if (notification.event === NOTIFICATION_EVENTS.MEMBERSHIP_PAID) {
        const { tier, paymentMethod, amount } = notification.metadata;

        // Open the premium payment modal with the data from the notification
        premiumModalStore.open({
          amount,
          tier,
          paymentMethod,
          // colorKey,
        });
      }
      const newNotification: Notification = {
        ...notification,
        priority: getPriorityForType(notification.event),
      };

      addNotification(newNotification);
    },
    [addNotification, premiumModalStore],
  );

  // Initialize notifications from the user object
  useEffect(() => {
    if (user?.notifications && !initialized) {
      // Process each notification before adding it to state
      const processedNotifications = user.notifications.map(notification => ({
        ...notification,
        priority: getPriorityForType(notification.event),
      }));

      // Add all processed notifications to state
      setNotifications((prev) => {
        // Sort using your existing sort logic
        const combined = [...processedNotifications, ...prev];
        return combined.sort((a, b) => {
          // First sort by priority
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          // Then by read status (unread first)
          if (a.isSeen !== b.isSeen) {
            return a.isSeen ? 1 : -1;
          }

          // Finally by timestamp (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });

      setInitialized(true);
    }
  }, [user, getPriorityForType, initialized]);

  // WebSocket integration
  useWebSocket({
    url: import.meta.env.VITE_API_URL || 'http:localhost:1337',
    onMessage: (message) => {
      try {
        handleNotification(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    },
  });

  useEffect(() => {
    const unreadNotifications = notifications.filter(notification => !notification.isSeen);
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
