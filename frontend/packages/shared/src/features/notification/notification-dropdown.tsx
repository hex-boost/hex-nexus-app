import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useNotifications } from '@/hooks/useNotifications.tsx';
import { cn } from '@/lib/utils.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, Cog, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CustomScrollbar } from './CustomScrollbar.tsx';
import { NotificationEmptyState } from './notification-empty-state.tsx';
import { NotificationItem } from './notification-item.tsx';
import { NotificationSettings } from './notification-settings.tsx';

export function NotificationDropdown() {
  const { notifications, markAllAsRead, clearAll, isDropdownOpen, setIsDropdownOpen, unreadCount } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  // Handle keyboard navigation
  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, setIsDropdownOpen]);

  // Filter notifications based on the selected tab
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') {
      return !notification.isSeen;
    }
    return true;
  });

  if (!isDropdownOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      ref={dropdownRef}
      className={cn(
        'absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-card rounded-lg shadow-lg',
        'border border-gray-200 dark:border-[#1F1F23] z-50',
        'max-h-[80vh] flex flex-col',
      )}
      role="dialog"
      aria-label="Notifications"
    >
      <div className="p-4 border-b border-gray-200 dark:border-[#1F1F23] flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {activeTab === 'notifications'
            ? (
                <>
                  <Bell className="h-4 w-4" />
                  Notifications
                </>
              )
            : (
                <>
                  <Cog className="h-4 w-4" />
                  Settings
                </>
              )}
        </h3>
        <div className="flex gap-2">
          {activeTab === 'notifications' && (
            <button
              onClick={markAllAsRead}
              className={cn(
                'text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1F1F23]',
                unreadCount === 0 && 'opacity-50 cursor-not-allowed',
              )}
              aria-label="Mark all as read"
              disabled={unreadCount === 0}
            >
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          {/* <button */}
          {/*  onClick={() => setActiveTab(activeTab === 'notifications' ? 'settings' : 'notifications')} */}
          {/*  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1F1F23]" */}
          {/*  aria-label={activeTab === 'notifications' ? 'Notification settings' : 'Back to notifications'} */}
          {/* > */}
          {/*  {activeTab === 'notifications' */}
          {/*    ? ( */}
          {/*        <> */}
          {/*          <Settings className="h-3 w-3" /> */}
          {/*          <span className="hidden sm:inline">Settings</span> */}
          {/*        </> */}
          {/*      ) */}
          {/*    : ( */}
          {/*        <> */}
          {/*          <Bell className="h-3 w-3" /> */}
          {/*          <span className="hidden sm:inline">Notifications</span> */}
          {/*        </> */}
          {/*      )} */}
          {/* </button> */}
          <button
            onClick={() => setIsDropdownOpen(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#1F1F23]"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={value => setActiveTab(value as 'notifications' | 'settings')}
        className="flex-1 flex flex-col"
      >
        <TabsContent value="notifications" className="flex-1 flex flex-col m-0 p-0 data-[state=active]:flex-1">
          <Tabs
            defaultValue="all"
            className="w-full flex-1 flex flex-col"
            onValueChange={value => setFilter(value as 'all' | 'unread')}
          >
            <div className="border-b border-gray-200 dark:border-[#1F1F23] px-4">
              <TabsList className="h-9 bg-transparent border-b-0">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white rounded-none h-9 px-4"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white rounded-none h-9 px-4"
                >
                  Unread
                  {' '}
                  {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
              </TabsList>
            </div>

            <CustomScrollbar ref={scrollContainerRef} className="flex-1 min-h-0 max-h-[400px]">
              <TabsContent value="all" className="m-0 p-0 h-full">
                <AnimatePresence>
                  {notifications.length > 0
                    ? (
                        <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                          {notifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                          ))}
                        </div>
                      )
                    : (
                        <NotificationEmptyState type="all" />
                      )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="unread" className="m-0 p-0 h-full">
                <AnimatePresence>
                  {filteredNotifications.length > 0
                    ? (
                        <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                          {filteredNotifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                          ))}
                        </div>
                      )
                    : (
                        <NotificationEmptyState type="unread" />
                      )}
                </AnimatePresence>
              </TabsContent>
            </CustomScrollbar>
          </Tabs>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-[#1F1F23] text-center">
              <div className="flex justify-between items-center">
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors"
                >
                  Clear all
                </button>
                {/* <Link */}
                {/*  to="/notifications" */}
                {/*  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center gap-1" */}
                {/* > */}
                {/*  View all notifications */}
                {/*  <svg */}
                {/*    xmlns="http://www.w3.org/2000/svg" */}
                {/*    className="h-3 w-3" */}
                {/*    fill="none" */}
                {/*    viewBox="0 0 24 24" */}
                {/*    stroke="currentColor" */}
                {/*  > */}
                {/*    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /> */}
                {/*  </svg> */}
                {/* </Link> */}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 p-0 data-[state=active]:flex-1">
          <CustomScrollbar className="max-h-[400px]">
            <div className="p-4">
              <NotificationSettings inDropdown />
            </div>
          </CustomScrollbar>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
