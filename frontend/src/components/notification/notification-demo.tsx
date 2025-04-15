import type { NotificationType } from './notification-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useNotifications } from './notification-provider';
import { NotificationSettings } from './notification-settings';
import { NotificationSound } from './notification-sound';
import { useNotificationSocket } from './use-notification-socket';

export function NotificationDemo() {
  const { addNotification } = useNotifications();
  const socket = useNotificationSocket();
  const [activeTab, setActiveTab] = useState('demo');

  const createNotification = (type: NotificationType) => {
    const notifications = {
      account_expired: {
        title: 'Account Expired',
        message: 'Your League of Legends account \'SummonerKing123\' has expired. Renew now to continue using it.',
      },
      subscription_expiring: {
        title: 'Subscription Expiring Soon',
        message: 'Your premium subscription will expire in 3 days. Extend now to avoid interruption.',
      },
      subscription_paid: {
        title: 'Payment Successful',
        message: 'Your monthly subscription payment of $19.99 was successfully processed.',
      },
      account_expiring: {
        title: 'Account Expiring Soon',
        message: 'Your League of Legends account \'DragonSlayer99\' will expire in 2 days.',
      },
      system_message: {
        title: 'Maintenance Scheduled',
        message:
          'We\'ll be performing system maintenance on June 15th from 2-4 AM UTC. Service may be temporarily unavailable.',
        actionUrl: '#maintenance-details',
      },
    };

    addNotification({
      type,
      ...notifications[type],
    });
  };

  return (
    <div className="w-full">
      <NotificationSound notificationType="account_expired" />

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="demo">Demo Notifications</TabsTrigger>
          <TabsTrigger value="settings">Notification Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-4">
          <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23] space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click the buttons below to trigger different types of notifications.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => createNotification('account_expired')}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Account Expired
              </Button>
              <Button
                variant="outline"
                onClick={() => createNotification('subscription_expiring')}
                className="border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                Subscription Expiring
              </Button>
              <Button
                variant="outline"
                onClick={() => createNotification('subscription_paid')}
                className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-900/20"
              >
                Payment Successful
              </Button>
              <Button
                variant="outline"
                onClick={() => createNotification('account_expiring')}
                className="border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                Account Expiring
              </Button>
              <Button
                variant="outline"
                onClick={() => createNotification('system_message')}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                System Message
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-[#1F1F23] mt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">WebSocket Simulation</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                This simulates receiving notifications via WebSockets. A notification will automatically appear after 5
                seconds.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={socket.reconnect} className="text-xs">
                  Reconnect Socket
                </Button>
                <Button variant="outline" size="sm" onClick={socket.disconnect} className="text-xs">
                  Disconnect Socket
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
