import UpdateOverlay from '@/components/update-animation/update-overlay.tsx';
import { useUpdateManager } from '@/hooks/useUpdateManager.tsx';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    updateStatus,
    isUpdateOverlayVisible,
    startUpdate,
    restartApplication,
    hideUpdateOverlay,
  } = useUpdateManager();

  // Mapeamento do status do backend para o componente
  const mapStatusToUiStatus = (): 'checking' | 'downloading' | 'installing' | 'complete' | 'error' => {
    switch (updateStatus.status) {
      case 'Verificando atualizações...':
        return 'checking';
      case 'Baixando atualização...':
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
      restartApplication();
    } else if (updateStatus.status === 'error') {
      hideUpdateOverlay();
    } else if (updateStatus.needsUpdate) {
      startUpdate();
    } else {
      hideUpdateOverlay();
    }
  };

  useEffect(() => {
    if (updateStatus.status === 'complete') {
      // Aguardar um tempo para mostrar a mensagem de conclusão
      const timer = setTimeout(() => {
        restartApplication();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [updateStatus.status]);

  return (
  // <div
  //   className={`flex flex-col h-screen bg-[#0F0F12] text-white ${isMaximized ? 'w-screen' : 'w-[1024px] mx-auto'}`}
  // >
  //
  //   <Button onClick={() => setShowDemo(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
  //     Demo Update Animation
  //   </Button>

    <UpdateOverlay isVisible onComplete={() => setShowDemo(false)} simulateUpdate />
    // </div>
  );
}
