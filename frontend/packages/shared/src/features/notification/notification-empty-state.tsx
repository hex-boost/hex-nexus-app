import { cn } from '@/lib/utils.ts';
import { motion } from 'framer-motion';
import { AlertCircle, Bell, CheckCircle } from 'lucide-react';

type NotificationEmptyStateProps = {
  type?: 'all' | 'unread' | 'read';
  className?: string;
};

export function NotificationEmptyState({ type = 'all', className }: NotificationEmptyStateProps) {
  return (
    <div className={cn('py-12 px-4 text-center flex flex-col items-center', className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-16 h-16 rounded-full bg-gray-100 dark:bg-muted/20 flex items-center justify-center mb-4"
      >
        {type === 'unread'
          ? (
              <AlertCircle className="h-8 w-8 text-gray-400 dark:text-white/60" />
            )
          : type === 'read'
            ? (
                <CheckCircle className="h-8 w-8 text-gray-400 dark:text-gray-600" />
              )
            : (
                <Bell className="h-8 w-8 text-gray-400 dark:text-gray-600" />
              )}
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <p className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {type === 'unread'
            ? 'You\'re all caught up!'
            : type === 'read'
              ? 'No read notifications yet'
              : 'No notifications yet'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {type === 'unread'
            ? 'You have no new notifications to review'
            : type === 'read'
              ? 'Notifications you\'ve read will appear here'
              : 'We\'ll notify you when something important happens'}
        </p>
      </motion.div>
    </div>
  );
}
