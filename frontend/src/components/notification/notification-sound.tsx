import { useNotifications } from '@/hooks/useNotifications.tsx';
import { useEffect, useRef } from 'react';

type NotificationSoundProps = {
  notificationType?: string;
};

export function NotificationSound({ notificationType = 'account_expired' }: NotificationSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { notifications } = useNotifications();
  const prevNotificationsLength = useRef(notifications.length);

  useEffect(() => {
    // Only play sound when a new notification is added
    if (notifications.length > prevNotificationsLength.current) {
      // Check if the newest notification matches the type we want to play sound for
      const newestNotification = notifications[0];
      if (newestNotification && newestNotification.type === notificationType) {
        audioRef.current?.play().catch((error) => {
          console.error('Failed to play notification sound:', error);
        });
      }
    }

    prevNotificationsLength.current = notifications.length;
  }, [notifications, notificationType]);

  return <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" className="hidden" />;
}
