import type { ServerNotificationEvents } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useNotifications } from '@/features/notification/hooks/useNotifications.tsx';
import { cn } from '@/lib/utils.ts';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Info,
  Mail,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';

type NotificationSettingsProps = {
  inDropdown?: boolean;
};

export function NotificationSettings({ inDropdown = false }: NotificationSettingsProps) {
  const { preferences, setPreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState({ ...preferences });
  const [_, setActiveTab] = useState<'general' | 'sound'>('general');
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(!preferences.soundEnabled);

  const handleToggleType = (type: ServerNotificationEvents) => {
    setLocalPrefs(prev => ({
      ...prev,
      enabledTypes: {
        ...prev.enabledTypes,
        [type]: !prev.enabledTypes[type],
      },
    }));
  };

  // const handleToggleSound = () => {
  //   setLocalPrefs(prev => ({
  //     ...prev,
  //     soundEnabled: !prev.soundEnabled,
  //   }));
  //   setIsMuted(!localPrefs.soundEnabled);
  // };

  const handleToggleEmail = () => {
    setLocalPrefs(prev => ({
      ...prev,
      emailEnabled: !prev.emailEnabled,
    }));
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] === 0) {
      setIsMuted(true);
      setLocalPrefs(prev => ({
        ...prev,
        soundEnabled: false,
      }));
    } else if (isMuted) {
      setIsMuted(false);
      setLocalPrefs(prev => ({
        ...prev,
        soundEnabled: true,
      }));
    }
  };

  const handleSave = () => {
    setPreferences(localPrefs);
  };

  const getNotificationTypeIcon = (type: ServerNotificationEvents) => {
    switch (type) {
      case 'account_expired':
        return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'membership_ending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'membership_paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'account_expiring':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'system_message':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationTypeLabel = (type: ServerNotificationEvents) => {
    switch (type) {
      case 'account_expired':
        return 'Account Expired';
      case 'membership_ending':
        return 'Subscription Expiring';
      case 'membership_paid':
        return 'Payment Confirmations';
      case 'account_expiring':
        return 'Account Expiring Soon';
      case 'system_message':
        return 'System Messages';
    }
  };

  const getNotificationTypeDescription = (type: ServerNotificationEvents) => {
    switch (type) {
      case 'account_expired':
        return 'Notify when your account access has expired';
      case 'membership_ending':
        return 'Notify before your subscription expires';
      case 'membership_paid':
        return 'Confirm successful payments';
      case 'account_expiring':
        return 'Notify before your account access expires';
      case 'system_message':
        return 'Important announcements and updates';
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-5 w-5" />;
    }
    if (volume < 50) {
      return <Volume1 className="h-5 w-5" />;
    }
    return <Volume2 className="h-5 w-5" />;
  };

  return (
    <div className={cn('space-y-4', inDropdown ? '' : 'max-w-3xl mx-auto')}>
      {!inDropdown && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Customize which notifications you receive and how they are delivered.
          </p>
        </div>
      )}

      <Tabs defaultValue="general" onValueChange={value => setActiveTab(value as 'general' | 'sound')}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sound">Sound & Volume</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notification Types</h4>

            {Object.entries(localPrefs.enabledTypes).map(([type, enabled]) => (
              <div
                key={type}
                className="flex items-start space-x-4 py-3 border-b border-gray-200 dark:border-[#1F1F23]"
              >
                <div className="flex-shrink-0 pt-0.5">{getNotificationTypeIcon(type as ServerNotificationEvents)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getNotificationTypeLabel(type as ServerNotificationEvents)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {getNotificationTypeDescription(type as ServerNotificationEvents)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleToggleType(type as ServerNotificationEvents)}
                    aria-label={`Enable ${getNotificationTypeLabel(type as ServerNotificationEvents)} notifications`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Delivery Preferences</h4>

            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-[#1F1F23]">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                checked={localPrefs.emailEnabled}
                onCheckedChange={handleToggleEmail}
                aria-label="Enable email notifications"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Do Not Disturb</h4>

            <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-[#1F1F23]">
              <div className="flex items-center space-x-3">
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Do Not Disturb</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Silence notifications during specified hours
                  </p>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="sound" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {getVolumeIcon()}
                <span>Notification Sounds</span>
              </h4>
              <Switch
                checked={!isMuted}
                onCheckedChange={() => {
                  setIsMuted(!isMuted);
                  setLocalPrefs(prev => ({
                    ...prev,
                    soundEnabled: isMuted,
                  }));
                }}
                aria-label="Enable notification sounds"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {getVolumeIcon()}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Volume</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {volume}
                  %
                </span>
              </div>

              <Slider
                defaultValue={[volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                disabled={isMuted}
                className={cn(isMuted && 'opacity-50')}
              />

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Account Expired</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!isMuted) {
                        // Play test sound
                        const audio = new Audio('/sounds/account-expired.mp3');
                        audio.volume = volume / 100;
                        audio.play().then(r => r);
                      }
                    }}
                    className={cn(
                      'text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                      'hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors',
                      (isMuted || volume === 0) && 'opacity-50 cursor-not-allowed',
                    )}
                    disabled={isMuted || volume === 0}
                  >
                    Test Sound
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">General Notifications</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!isMuted) {
                        // Play test sound
                        const audio = new Audio('/sounds/notification.mp3');
                        audio.volume = volume / 100;
                        audio.play().then(r => r);
                      }
                    }}
                    className={cn(
                      'text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                      'hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors',
                      (isMuted || volume === 0) && 'opacity-50 cursor-not-allowed',
                    )}
                    disabled={isMuted || volume === 0}
                  >
                    Test Sound
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <p>
                Sound settings apply to all notification types. Individual notification types can be enabled or disabled
                in the General tab.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
