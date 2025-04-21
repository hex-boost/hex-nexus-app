import UpdateOverlay from '@/components/update-animation/update-overlay.tsx';
import { useUpdateManager } from '@/hooks/useUpdateManager.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    updateStatus,
    isUpdateOverlayVisible,
    downloadUpdate,
    checkForUpdates,
    restartApplication,
    hideUpdateOverlay,
  } = useUpdateManager();

  // Mapeamento do status do backend para o componente
  const mapStatusToUiStatus = (): 'checking' | 'starting' | 'downloading' | 'installing' | 'complete' | 'error' => {
    switch (updateStatus.status) {
      case 'Verificando atualizações...':
        return 'checking';
      case 'Atualização disponível':
        return 'checking';
      case 'Baixando atualização...':
        return 'downloading';
      case 'Download concluído':
        return 'downloading';
      case 'Instalando atualização...':
        return 'installing';
      case 'complete':
        return 'complete';
      case 'error':
        return 'error';
      default:
        return 'checking';
    }
  };

  const handleComplete = () => {
    if (updateStatus.status === 'complete') {

    } else if (updateStatus.status === 'error') {
      hideUpdateOverlay();
    } else if (updateStatus.needsUpdate && !updateStatus.status.includes('Baixando') && !updateStatus.status.includes('Instalando')) {
      // Se há atualização disponível e não está baixando ou instalando
      downloadUpdate();
    } else {
      hideUpdateOverlay();
    }
  };

  return (
    <UpdateOverlay
      isVisible
      status={mapStatusToUiStatus()}
      progress={updateStatus.progress}
      error={updateStatus.error}
      onComplete={() => handleComplete()}
    />
  );
}
