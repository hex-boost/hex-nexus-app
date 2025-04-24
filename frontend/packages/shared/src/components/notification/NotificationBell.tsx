import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

import { useNotifications } from '@/hooks/useNotifications.tsx';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationBell() {
  const { hasUnread, unreadCount, isDropdownOpen, setIsDropdownOpen, notifications } = useNotifications();

  const [isAnimating, setIsAnimating] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const prevNotificationCount = useRef(notifications.length);

  useOnClickOutside(bellRef as any, () => setIsDropdownOpen(false));

  // Animate bell when new notification arrives
  useEffect(() => {
    if (notifications.length > prevNotificationCount.current) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    prevNotificationCount.current = notifications.length;
  }, [notifications.length]);

  return (
    <div
      ref={bellRef}
      className="relative"
      style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}

    >
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                'p-1.5 sm:p-2 rounded-full transition-colors relative',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'focus:ring-blue-500 dark:focus:ring-blue-400',
                isDropdownOpen ? 'dark:bg-shade7 text-white fill-white' : 'text-muted-foreground dark:hover:bg-shade7 ',
                isAnimating && 'animate-bell',
              )}
              aria-label={`Notifications ${hasUnread ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />

              <AnimatePresence>
                {hasUnread && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[10px] font-bold text-white items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{hasUnread ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <NotificationDropdown />
    </div>
  );
}
