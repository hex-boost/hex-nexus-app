// frontend/packages/shared/src/hooks/useUpdateManager.tsx
import type { UpdateStatusEnum } from '@/components/update-animation/update-overlay.tsx';
import { UpdateManager } from '@manager';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

type UpdateStatus = {
  status: UpdateStatusEnum;
  progress: number;
  latestVersion?: string;
  currentVersion: string;
  error?: string;
  needsUpdate: boolean;
  downloadPath?: string;
};

export function useUpdateManager() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    status: 'checking',
    progress: 0,
    currentVersion: '',
    needsUpdate: false,
  });

  const restartApplication = async () => {
    await UpdateManager.StartMainApplication('Nexus.exe');
  };

  const installUpdate = async (downloadPath: string, version: string) => {
    try {
      setUpdateStatus(prev => ({ ...prev, status: 'installing', progress: 60 }));

      await UpdateManager.InstallUpdate(downloadPath, version);

      setUpdateStatus(prev => ({
        ...prev,
        status: 'complete',
        progress: 100,
      }));
    } catch (error) {
      console.error('Error installing update:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Error installing update',
      }));
    }
  };

  const downloadUpdate = async () => {
    try {
      setUpdateStatus(prev => ({ ...prev, status: 'downloading', progress: 10 }));

      const [downloadPath, version] = await UpdateManager.DownloadUpdate();

      setUpdateStatus(prev => ({
        ...prev,
        downloadPath,
        latestVersion: version,
        progress: 50,
      }));

      // Immediately install after download
      await installUpdate(downloadPath, version);

      return { downloadPath, version };
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Error downloading update',
      }));
      return null;
    }
  };
  const Exit = async () => {
    UpdateManager.Exit();
  };
  const checkForUpdates = async () => {
    try {
      setUpdateStatus(prev => ({ ...prev, status: 'checking', progress: 0 }));

      // Call backend function to check for updates
      const [needsUpdate, version] = await UpdateManager.CheckForUpdates();

      if (needsUpdate) {
        setUpdateStatus(prev => ({
          ...prev,
          latestVersion: version,
          needsUpdate: true,
          status: 'downloading', // Start downloading immediately
          progress: 5,
        }));

        // Start download process immediately
        await downloadUpdate();
      } else {
        setUpdateStatus(prev => ({
          ...prev,
          latestVersion: version,
          needsUpdate: false,
          status: 'complete',
          progress: 100,
        }));
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Error checking for updates',
      }));
    }
  };

  useEffect(() => {
    // Subscribe to receive status updates
    const unsubscribe = Events.On('updater:status-change', (event) => {
      setUpdateStatus(prev => ({ ...prev, ...event.data[0] }));
    });

    checkForUpdates();

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    updateStatus,
    installUpdate,
    checkForUpdates,
    downloadUpdate,
    restartApplication,
    Exit,
  };
}
