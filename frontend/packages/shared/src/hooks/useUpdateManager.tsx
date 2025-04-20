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
    const unsubscribe = Events.On('updater:status-change', (status: UpdateStatus) => {
      setUpdateStatus(status);
    });

    // Verificar se há atualizações ao montar o componente
    checkForUpdates();

    return () => {
      unsubscribe();
    };
  }, []);

  const checkForUpdates = async () => {
    try {
      // Chama a função do backend para verificar atualizações
      const status = await window.go.updater.UpdaterService.CheckForUpdates();
      setUpdateStatus(status);

      if (status.needsUpdate) {
        setIsUpdateOverlayVisible(true);
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    }
  };

  const startUpdate = async () => {
    try {
      const status = await window.go.updater.UpdaterService.StartUpdate();
      setUpdateStatus(status);
    } catch (error) {
      console.error('Erro ao iniciar atualização:', error);
    }
  };

  const restartApplication = async () => {
    await window.go.updater.UpdaterService.RestartApplication();
  };

  const hideUpdateOverlay = () => {
    setIsUpdateOverlayVisible(false);
  };

  return {
    updateStatus,
    isUpdateOverlayVisible,
    checkForUpdates,
    startUpdate,
    restartApplication,
    hideUpdateOverlay,
  };
}
