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
      console.error('Erro ao instalar atualização:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Erro ao instalar atualização',
      }));
    }
  };
  const checkForUpdates = async () => {
    try {
      setUpdateStatus(prev => ({ ...prev, status: 'checking', progress: 0 }));

      // Chama a função do backend para verificar atualizações
      const [needsUpdate, version] = await UpdateManager.CheckForUpdates();

      setUpdateStatus(prev => ({
        ...prev,
        latestVersion: version,
        needsUpdate,
        status: 'available',
        progress: 0,
      }));
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Erro ao verificar atualizações',
      }));
    }
  };
  useEffect(() => {
    // Inscrever-se para receber atualizações de status
    const unsubscribe = Events.On('updater:status-change', (event) => {
      setUpdateStatus(prev => ({ ...prev, ...event.data[0] }));
    });

    checkForUpdates();

    return () => {
      unsubscribe();
    };
  }, []);

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
      return { downloadPath, version };
    } catch (error) {
      console.error('Erro ao baixar atualização:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Erro ao baixar atualização',
      }));
    }
  };

  return {
    updateStatus,
    installUpdate,
    checkForUpdates,
    downloadUpdate,
    restartApplication,
  };
}
