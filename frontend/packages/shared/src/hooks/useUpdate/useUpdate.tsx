import { useLocalStorage } from '@/hooks/use-local-storage';
import { useQuery } from '@tanstack/react-query';
import { Utils } from '@utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export type UpdateInfo = {
  version: string;
  features?: string[];
};

export function useUpdate() {
  // Using proper Version type from the provided types
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    version: import.meta.env.VITE_APP_VERSION || '',
  });

  // Store last seen update in local storage
  const [lastSeenUpdate, setLastSeenUpdate] = useLocalStorage<string>('last-update-version', import.meta.env.VITE_APP_VERSION || '');

  async function getLatestVersion() {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/versions/latest`);

    if (!response.ok) {
      throw new Error('Failed to fetch version information');
    }

    return await response.json();
  }

  const { data: versionData, refetch } = useQuery({
    queryKey: ['check-update'],
    queryFn: getLatestVersion,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Effect to process version data when it changes
  useEffect(() => {
    if (versionData?.latestVersion) {
      const latestVersion = versionData.latestVersion.version;

      setUpdateInfo({
        version: latestVersion,
        features: versionData.latestVersion.features || [],
      });

      // Show toast if there's a new version and we haven't seen it before
      const currentAppVersion = import.meta.env.VITE_APP_VERSION || '';
      if (latestVersion !== currentAppVersion && latestVersion !== lastSeenUpdate) {
        toast.info('New update available!', {
          description: 'Update to the latest version to receive new features and improvements.',
          action: {
            type: 'button',
            label: 'Update now',
            onClick: () => {
              // Handle update action
              window.open(versionData.latestVersion.installer?.url, '_blank');
              setLastSeenUpdate(latestVersion);
            },
          },
        });
      }
    }
  }, [versionData, lastSeenUpdate, setLastSeenUpdate]);

  // Check if update is available
  const isAvailable = updateInfo.version !== import.meta.env.VITE_APP_VERSION
    && updateInfo.version !== '';

  // Function to handle websocket update notification
  const handleUpdateNotification = (version: string, features?: string[]) => {
    setUpdateInfo({
      version,
      features,
    });

    // Show notification toast
    if (version !== import.meta.env.VITE_APP_VERSION && version !== lastSeenUpdate) {
      toast.info('New update available!', {
        description: 'Update to the latest version to receive new features and improvements.',
        action: {
          type: 'button',
          label: 'Update now',
          onClick: () => {
            // Handle update action
            setLastSeenUpdate(version);
          },
        },
      });
    }
  };
  async function handleStartUpdate() {
    await Utils.StartUpdate();
  }
  return {
    handleStartUpdate,
    updateInfo,
    setUpdateInfo,
    isAvailable,
    getLatestVersion,
    refetchVersion: refetch,
    handleUpdateNotification,
  };
}
