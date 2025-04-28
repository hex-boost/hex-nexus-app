import type { ServerNotification } from '@/types/types.ts';
import type React from 'react';
import { useNotifications } from '@/features/notification/hooks/useNotifications.tsx';
import { cn } from '@/lib/utils.ts';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertOctagon, AlertTriangle, CheckCircle, Clock, Eye, EyeOff, Info, X } from 'lucide-react';
import { useState } from 'react';

type NotificationItemProps = {
  notification: ServerNotification;
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, removeNotification } = useNotifications();
  const [isExiting, setIsExiting] = useState(false);

  const handleMarkAsRead = () => {
    if (!notification.isSeen) {
      markAsRead(notification.documentId);
    }
  };

  const handleToggleReadStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.isSeen) {
      console.log('Would mark as unread:', notification.documentId);
    } else {
      markAsRead(notification.documentId);
    }
  };

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeNotification(notification.documentId);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.event) {
      case 'account_expired':
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'membership_ending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'membership_paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'account_expiring':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'system_message':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get background color based on notification type and read status
  const getBackgroundColor = () => {
    if (notification.isSeen) {
      return '';
    }

    switch (notification.event) {
      case 'account_expired':
        return 'bg-red-50 dark:bg-red-900/10';
      case 'membership_ending':
      case 'account_expiring':
        return 'bg-amber-50 dark:bg-amber-900/10';
      case 'membership_paid':
        return 'bg-green-50 dark:bg-green-900/10';
      case 'system_message':
        return 'bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'bg-gray-50 dark:bg-[#1F1F23]/50';
    }
  };

  // Get border color for the left border
  const getBorderColor = () => {
    switch (notification.event) {
      case 'account_expired':
        return 'border-l-4 border-l-red-500';
      case 'membership_ending':
      case 'account_expiring':
        return 'border-l-4 border-l-amber-500';
      case 'membership_paid':
        return 'border-l-4 border-l-green-500';
      case 'system_message':
        return 'border-l-4 border-l-blue-500';
      default:
        return '';
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'p-4 hover:bg-gray-50 dark:hover:bg-[#1F1F23]  transition-all relative',
        getBackgroundColor(),
        getBorderColor(),
        isExiting && 'opacity-0 transform translate-x-full transition-all duration-300',
      )}
      onClick={handleMarkAsRead}
      tabIndex={0}
      role="button"
      aria-label={`${notification.title} notification, ${notification.isSeen ? 'read' : 'unread'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleMarkAsRead();
        }
      }}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p
              className={cn('text-sm font-medium text-gray-900 dark:text-white', !notification.isSeen && 'font-semibold')}
            >
              {notification.title}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleReadStatus}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={notification.isSeen ? 'Mark as unread' : 'Mark as read'}
                title={notification.isSeen ? 'Mark as unread' : 'Mark as read'}
              >
                {notification.isSeen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{notification.message}</p>

          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {!notification.isSeen && (
        <span className="absolute top-4 right-12 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true"></span>
      )}
    </motion.div>
  );
}
