import { UpdateManager } from '@manager';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

type UpdateStatus = {
  status: string;
  progress: number;
  latestVersion?: string;
  currentVersion: string;
  error?: string;
  needsUpdate: boolean;
};

export function useUpdateManager() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    status: 'idle',
    progress: 0,
    currentVersion: '',
    needsUpdate: false,
  });

  const [isUpdateOverlayVisible, setIsUpdateOverlayVisible] = useState(false);

  useEffect(() => {
    // Inscrever-se para receber atualizações de status
    const unsubscribe = Events.On('updater:status-change', (event) => {
      setUpdateStatus(event.data[0]);
    });

    // Verificar se há atualizações ao montar o componente
    UpdateManager.CheckForUpdates();

    return () => {
      unsubscribe();
    };
  }, []);

  const checkForUpdates = async () => {
    try {
      // Chama a função do backend para verificar atualizações
      const [needsUpdate, version] = await UpdateManager.CheckForUpdates();
      setUpdateStatus({ latestVersion: version, needsUpdate, status: updateStatus.status, progress: 0, currentVersion: updateStatus.currentVersion });

      if (needsUpdate) {
        setIsUpdateOverlayVisible(true);
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    }
  };

  const downloadUpdate = async () => {
    try {
      const [downloadPath, version] = await UpdateManager.DownloadUpdate();
      setUpdateStatus(updateStatus);
    } catch (error) {
      console.error('Erro ao iniciar atualização:', error);
    }
  };

  const installUpdate = async (downloadPath: string, version: string) => {
    try {
      const [downloadPath, version] = await UpdateManager.InstallUpdate(downloadPath, version);
      setUpdateStatus(updateStatus);
    } catch (error) {
      console.error('Erro ao iniciar atualização:', error);
    }
  };

  const restartApplication = async () => {
    await UpdateManager.StartMainApplication('Nexus');
  };

  const hideUpdateOverlay = () => {
    setIsUpdateOverlayVisible(false);
  };

  return {
    updateStatus,
    isUpdateOverlayVisible,
    checkForUpdates,
    downloadUpdate,
    restartApplication,
    hideUpdateOverlay,
  };
}
