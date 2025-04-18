import type { NotificationPreferences, NotificationPriority } from '@/types/notification.ts';
import type { ServerNotification, ServerNotificationEvents, UserType } from '@/types/types.ts';
import type { ReactNode } from 'react';
import notificationSound from '@/assets/sounds/notification.ogg';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useWebSocket } from '@/hooks/use-websocket';
import { strapiClient } from '@/lib/strapi.ts';
import { usePremiumPaymentModalStore } from '@/stores/usePremiumPaymentModalStore';
import { useUserStore } from '@/stores/useUserStore.ts';
import { DEFAULT_PREFERENCES, NOTIFICATION_EVENTS, NotificationContext } from '@/types/notification.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Utils } from '@utils';
import { Howl } from 'howler';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useUserStore();
  const premiumModalStore = usePremiumPaymentModalStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [initialized, setInitialized] = useState(false);

  const queryClient = useQueryClient();

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

  const sortNotifications = useCallback((notifications: ServerNotification[]) => {
    return [...notifications].sort((a, b) => {
      // First sort by priority
      // const priorityOrder = { high: 0, medium: 1, low: 2 };
      // const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

      // if (priorityDiff !== 0) {
      //   return priorityDiff;
      // }

      // Then by read status (unread first)
      if (a.isSeen !== b.isSeen) {
        return a.isSeen ? 1 : -1;
      }

      // Finally by timestamp (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, []);

  const updateUserNotifications = useCallback((updaterFn: (notifications: ServerNotification[]) => ServerNotification[]) => {
    queryClient.setQueryData(['users', 'me'], (oldData?: UserType) => {
      if (!oldData) {
        return oldData;
      }

      const updatedNotifications = updaterFn(oldData.notifications || []);

      return {
        ...oldData,
        notifications: sortNotifications(updatedNotifications),
      };
    });
  }, [queryClient, sortNotifications]);

  const addNotification = useCallback((notification: ServerNotification) => {
    if (!preferences.enabledTypes[notification.event as ServerNotificationEvents]) {
      return;
    }

    const newNotification: ServerNotification = { ...notification };
    console.info('New notification being added', newNotification);

    updateUserNotifications((prevNotifications) => {
      // Check if notification with same documentId already exists
      const existingIndex = prevNotifications.findIndex(n => n.documentId === newNotification.documentId);

      // If exists, update it instead of adding a new one
      if (existingIndex !== -1) {
        const updated = [...prevNotifications];
        updated[existingIndex] = newNotification;
        return updated;
      }

      // If it doesn't exist, add as new
      return [newNotification, ...prevNotifications];
    });

    // Only play sound for genuinely new notifications (not updates)
    if (!notification.isSeen) {
      playSound();
    }
  }, [playSound, preferences.enabledTypes, updateUserNotifications]);

  const { mutate: markAsRead } = useMutation({
    mutationKey: ['notifications', 'seen'],
    mutationFn: async (documentId: string) => {
      return strapiClient.update(`notifications`, documentId, {
        isSeen: true,
      });
    },
    onMutate: async (documentId) => {
      updateUserNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.documentId === documentId ? { ...notification, isSeen: true } : notification,
        ),
      );
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });

  const { mutate: removeNotification } = useMutation({
    mutationKey: ['notifications', 'delete'],
    mutationFn: async (documentId: string) => {
      return strapiClient.delete(`notifications`, documentId);
    },
    onMutate: async (documentId) => {
      // Optimistic update
      updateUserNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.documentId !== documentId),
      );
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });

  const { mutate: markAllAsRead } = useMutation({
    mutationKey: ['notifications', 'seen', 'all'],
    mutationFn: async () => {
      const unreadNotifications = (user?.notifications || []).filter(
        notification => !notification.isSeen,
      );

      return Promise.all(
        unreadNotifications.map(notification =>
          strapiClient.update(`notifications`, notification.documentId, {
            isSeen: true,
          }),
        ),
      );
    },
    onMutate: async () => {
      updateUserNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isSeen: true })),
      );
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });

  const { mutate: clearAll } = useMutation({
    mutationKey: ['notifications', 'delete', 'all'],
    mutationFn: async () => {
      return Promise.all(
        (user?.notifications || []).map(notification =>
          strapiClient.delete(`notifications`, notification.documentId),
        ),
      );
    },
    onMutate: async () => {
      updateUserNotifications(() => []);
    },
    onError: () => {
      toast.error('Failed to delete all notifications');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
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

      // Add priority to the notification
      const newNotification: ServerNotification = {
        ...notification,
      };

      addNotification(newNotification);

      if (notification.event === NOTIFICATION_EVENTS.ACCOUNT_EXPIRED) {
        Utils.ForceCloseAllClients().then(() => {
          toast.info('Your account has expired, and the league has been closed.');
        });
      }
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
    [addNotification, premiumModalStore, getPriorityForType, queryClient],
  );
  // Initialize notifications from the user object
  useEffect(() => {
    console.log('Initializing notifications from user object', user?.notifications);
    if (user?.notifications && !initialized) {
      // Process each notification before adding it to state
      const processedNotifications = user.notifications.map(notification => ({
        ...notification,
        priority: getPriorityForType(notification.event),
      }));

      // Update the cache with processed notifications
      updateUserNotifications(() => processedNotifications);

      setInitialized(true);
    }
  }, [user, getPriorityForType, initialized, updateUserNotifications]);

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

  // Get notifications from the cached user object
  const notifications = user?.notifications || [];
  const unreadNotifications = notifications.filter(notification => !notification.isSeen);
  const hasUnread = unreadNotifications.length > 0;
  const unreadCount = unreadNotifications.length;

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
