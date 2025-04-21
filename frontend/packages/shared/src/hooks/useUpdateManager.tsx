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
  downloadPath?: string;
};

export function useUpdateManager() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    status: 'checking',
    progress: 0,
    currentVersion: '',
    needsUpdate: false,
  });

  const [isUpdateOverlayVisible, setIsUpdateOverlayVisible] = useState(false);

  useEffect(() => {
    // Inscrever-se para receber atualizações de status
    const unsubscribe = Events.On('updater:status-change', (event) => {
      setUpdateStatus(prev => ({ ...prev, ...event.data[0] }));
    });

    // Verificar se há atualizações ao montar o componente
    checkForUpdates();

    return () => {
      unsubscribe();
    };
  }, []);

  const checkForUpdates = async () => {
    try {
      setUpdateStatus(prev => ({ ...prev, status: 'Verificando atualizações...', progress: 0 }));

      // Chama a função do backend para verificar atualizações
      const [needsUpdate, version] = await UpdateManager.CheckForUpdates();

      setUpdateStatus(prev => ({
        ...prev,
        latestVersion: version,
        needsUpdate,
        status: needsUpdate ? 'Atualização disponível' : 'Atualizado',
        progress: 0,
      }));

      if (needsUpdate) {
        setIsUpdateOverlayVisible(true);
      } else {
        // Se não precisar de atualização, iniciar a aplicação principal
        await restartApplication();
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Erro ao verificar atualizações',
      }));
    }
  };

  const downloadUpdate = async () => {
    try {
      setUpdateStatus(prev => ({ ...prev, status: 'Baixando atualização...', progress: 10 }));

      const [downloadPath, version] = await UpdateManager.DownloadUpdate();

      setUpdateStatus(prev => ({
        ...prev,
        downloadPath,
        latestVersion: version,
        status: 'Download concluído',
        progress: 50,
      }));

      // Após download bem-sucedido, proceder com a instalação
      await installUpdate(downloadPath, version);
    } catch (error) {
      console.error('Erro ao baixar atualização:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Erro ao baixar atualização',
      }));
    }
  };

  const installUpdate = async (downloadPath: string, version: string) => {
    try {
      setUpdateStatus(prev => ({ ...prev, status: 'Instalando atualização...', progress: 60 }));

      await UpdateManager.InstallUpdate(downloadPath, version);

      setUpdateStatus(prev => ({
        ...prev,
        status: 'complete',
        progress: 100,
      }));

      // Configurar um timeout para reiniciar automaticamente após a conclusão da instalação
      setTimeout(() => {
        restartApplication();
      }, 2000);
    } catch (error) {
      console.error('Erro ao instalar atualização:', error);
      setUpdateStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Erro ao instalar atualização',
      }));
    }
  };

  const restartApplication = async () => {
    await UpdateManager.StartMainApplication('Nexus.exe');
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
