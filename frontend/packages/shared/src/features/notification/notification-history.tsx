import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { CustomScrollbar } from '@/features/notification/CustomScrollbar.tsx';
import { useNotifications } from '@/hooks/useNotifications.tsx';
import { AlertOctagon, AlertTriangle, Calendar, CheckCircle, Clock, Filter, Info, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import { NotificationEmptyState } from './notification-empty-state.tsx';
import { NotificationItem } from './notification-item.tsx';

export function NotificationHistory() {
  const { notifications, markAllAsRead, clearAll } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter notifications based on search term, type, period, and read status
  const filteredNotifications = notifications.filter((notification) => {
    // Search term filter
    const matchesSearch
      = searchTerm === ''
        || notification.title.toLowerCase().includes(searchTerm.toLowerCase())
        || notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = selectedType === 'all' || notification.event === selectedType;

    // Period filter
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const notificationDate = new Date(notification.createdAt);
      const now = new Date();

      switch (selectedPeriod) {
        case 'today':
          matchesPeriod = notificationDate.toDateString() === now.toDateString();
          break;
        case 'week':
        { const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesPeriod = notificationDate >= weekAgo;
          break; }
        case 'month':
        { const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchesPeriod = notificationDate >= monthAgo;
          break; }
      }
    }

    // Read status filter
    const matchesReadStatus
      = activeTab === 'all'
        || (activeTab === 'unread' && !notification.isSeen)
        || (activeTab === 'read' && notification.isSeen);

    return matchesSearch && matchesType && matchesPeriod && matchesReadStatus;
  });

  // const getTypeIcon = (type: string) => {
  //   switch (type) {
  //     case 'account_expired':
  //       return <AlertOctagon className="h-4 w-4 text-red-500" />;
  //     case 'subscription_expiring':
  //       return <Clock className="h-4 w-4 text-amber-500" />;
  //     case 'subscription_paid':
  //       return <CheckCircle className="h-4 w-4 text-green-500" />;
  //     case 'account_expiring':
  //       return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  //     case 'system_message':
  //       return <Info className="h-4 w-4 text-blue-500" />;
  //     case 'all':
  //       return <Filter className="h-4 w-4 text-gray-500" />;
  //     default:
  //       return <Filter className="h-4 w-4 text-gray-500" />;
  //   }
  // };

  const unreadCount = notifications.filter(n => !n.isSeen).length;
  const readCount = notifications.filter(n => n.isSeen).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-3xl font-semibold  ">Notification History</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs" disabled={unreadCount === 0}>
            Mark all as read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-900 dark:hover:border-red-800"
          >
            Clear all
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={value => setActiveTab(value as 'all' | 'unread' | 'read')}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All (
            {notifications.length}
            )
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread (
            {unreadCount}
            )
          </TabsTrigger>
          <TabsTrigger value="read">
            Read (
            {readCount}
            )
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px] h-10 text-sm">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span>All Types</span>
                </SelectItem>
                <SelectItem value="account_expired" className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-500" />
                  <span>Account Expired</span>
                </SelectItem>
                <SelectItem value="subscription_expiring" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Subscription Expiring</span>
                </SelectItem>
                <SelectItem value="subscription_paid" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Payment Confirmed</span>
                </SelectItem>
                <SelectItem value="account_expiring" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Account Expiring</span>
                </SelectItem>
                <SelectItem value="system_message" className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>System Message</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px] h-10 text-sm">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>All Time</span>
                </SelectItem>
                <SelectItem value="today" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Today</span>
                </SelectItem>
                <SelectItem value="week" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span>This Week</span>
                </SelectItem>
                <SelectItem value="month" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>This Month</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="m-0 p-0">
          <div className="bg-white dark:bg-card-darker rounded-lg border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
            <CustomScrollbar ref={scrollContainerRef} className="max-h-[600px]">
              {filteredNotifications.length > 0
                ? (
                    <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                      {filteredNotifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                      ))}
                    </div>
                  )
                : (
                    <div className="p-6">
                      <NotificationEmptyState type="all" />
                    </div>
                  )}
            </CustomScrollbar>
          </div>
        </TabsContent>

        <TabsContent value="unread" className="m-0 p-0">
          <div className="bg-white dark:bg-[#0F0F12] rounded-lg border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
            <CustomScrollbar className="max-h-[600px]">
              {filteredNotifications.length > 0
                ? (
                    <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                      {filteredNotifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                      ))}
                    </div>
                  )
                : (
                    <div className="p-6">
                      <NotificationEmptyState type="unread" />
                    </div>
                  )}
            </CustomScrollbar>
          </div>
        </TabsContent>

        <TabsContent value="read" className="m-0 p-0">
          <div className="bg-white dark:bg-[#0F0F12] rounded-lg border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
            <CustomScrollbar className="max-h-[600px]">
              {filteredNotifications.length > 0
                ? (
                    <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                      {filteredNotifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                      ))}
                    </div>
                  )
                : (
                    <div className="p-6">
                      <NotificationEmptyState type="read" />
                    </div>
                  )}
            </CustomScrollbar>
          </div>
        </TabsContent>
      </Tabs>

      {filteredNotifications.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Showing
          {' '}
          {filteredNotifications.length}
          {' '}
          of
          {' '}
          {notifications.length}
          {' '}
          notifications
        </div>
      )}
    </div>
  );
}
