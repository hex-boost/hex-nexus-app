import type React from 'react';
import type { Notification } from './notification-provider';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from './notification-provider';

type NotificationItemProps = {
  notification: Notification;
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, removeNotification } = useNotifications();
  const [isExiting, setIsExiting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleMarkAsRead = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleToggleReadStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.read) {
      // In a real app, you would have a markAsUnread function
      console.log('Would mark as unread:', notification.id);
    } else {
      markAsRead(notification.id);
    }
  };

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  const handleFeedback = (isHelpful: boolean) => {
    // In a real app, you would send this feedback to your backend
    console.log(`Notification ${notification.id} feedback: ${isHelpful ? 'helpful' : 'not helpful'}`);
    setFeedbackSubmitted(true);

    // Hide feedback UI after submission
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'account_expired':
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'subscription_expiring':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'subscription_paid':
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
    if (notification.read) {
      return '';
    }

    switch (notification.type) {
      case 'account_expired':
        return 'bg-red-50 dark:bg-red-900/10';
      case 'subscription_expiring':
      case 'account_expiring':
        return 'bg-amber-50 dark:bg-amber-900/10';
      case 'subscription_paid':
        return 'bg-green-50 dark:bg-green-900/10';
      case 'system_message':
        return 'bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'bg-gray-50 dark:bg-[#1F1F23]/50';
    }
  };

  // Get border color for the left border
  const getBorderColor = () => {
    switch (notification.type) {
      case 'account_expired':
        return 'border-l-4 border-l-red-500';
      case 'subscription_expiring':
      case 'account_expiring':
        return 'border-l-4 border-l-amber-500';
      case 'subscription_paid':
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
        'p-4 hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-all relative',
        getBackgroundColor(),
        getBorderColor(),
        isExiting && 'opacity-0 transform translate-x-full transition-all duration-300',
      )}
      onClick={handleMarkAsRead}
      tabIndex={0}
      role="button"
      aria-label={`${notification.title} notification, ${notification.read ? 'read' : 'unread'}`}
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
              className={cn('text-sm font-medium text-gray-900 dark:text-white', !notification.read && 'font-semibold')}
            >
              {notification.title}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleReadStatus}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
                title={notification.read ? 'Mark as unread' : 'Mark as read'}
              >
                {notification.read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

          {/* Action buttons */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {notification.actions.map((action, index) =>
                action.href
                  ? (
                      <Link
                        key={index}
                        to={action.href}
                        className={cn(
                          'text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1',
                          'transition-colors duration-200',
                          notification.type === 'account_expired'
                          && 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30',
                          notification.type === 'subscription_expiring'
                          && 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30',
                          notification.type === 'subscription_paid'
                          && 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
                          notification.type === 'account_expiring'
                          && 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30',
                          notification.type === 'system_message'
                          && 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30',
                        )}
                        onClick={e => e.stopPropagation()}
                      >
                        {action.label}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )
                  : (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (action.onClick) {
                            action.onClick();
                          }
                        }}
                        className={cn(
                          'text-xs font-medium px-3 py-1 rounded-full',
                          'transition-colors duration-200',
                          notification.type === 'account_expired'
                          && 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30',
                          notification.type === 'subscription_expiring'
                          && 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30',
                          notification.type === 'subscription_paid'
                          && 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
                          notification.type === 'account_expiring'
                          && 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30',
                          notification.type === 'system_message'
                          && 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30',
                        )}
                      >
                        {action.label}
                      </button>
                    ),
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </p>

            {/* Feedback buttons */}
            {!showFeedback
              ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFeedback(true);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Was this helpful?
                  </button>
                )
              : (
                  <div className="flex items-center gap-2">
                    {feedbackSubmitted
                      ? (
                          <span className="text-xs text-green-500 dark:text-green-400">Thanks for your feedback!</span>
                        )
                      : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(true);
                              }}
                              className="text-gray-500 hover:text-green-500 dark:hover:text-green-400"
                              aria-label="This notification was helpful"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(false);
                              }}
                              className="text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                              aria-label="This notification was not helpful"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </button>
                          </>
                        )}
                  </div>
                )}
          </div>
        </div>
      </div>

      {!notification.read && (
        <span className="absolute top-4 right-12 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true"></span>
      )}
    </motion.div>
  );
}
