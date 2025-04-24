import { useQuery } from '@tanstack/react-query';
import { Utils } from '@utils';
import { useState } from 'react';

export type UpdateInfo = {
  version: string;
  features?: string[];
};

export function useUpdate() {
  const currentVersion = import.meta.env.VITE_APP_VERSION || '';

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    version: currentVersion,
  });

  // Function to fetch the latest version
  async function getLatestVersion() {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/versions/latest`);

    if (!response.ok) {
      throw new Error('Failed to fetch version information');
    }

    return await response.json();
  }

  // Query to fetch latest version data
  const { refetch } = useQuery({
    queryKey: ['check-update'],
    queryFn: async () => {
      const versionData = await getLatestVersion();
      if (versionData?.latestVersion) {
        setUpdateInfo({
          version: versionData.latestVersion.version,
          features: versionData.latestVersion.features || [],
        });
      }
      return versionData;
    },
  });

  const isAvailable = Boolean(
    updateInfo.version
    && currentVersion
    && updateInfo.version !== currentVersion,
  );

  // Function to handle update
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

  };
}
