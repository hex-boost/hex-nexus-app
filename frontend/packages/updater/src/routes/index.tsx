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
    hideUpdateOverlay,
  } = useUpdateManager();

  // Map the frontend status to the UI component status
  const mapStatusToUiStatus = () => {
    switch (updateStatus.status) {
      case 'checking':
      case 'available':
        return 'checking';
      case 'downloading':
        return 'downloading';
      case 'installing':
        return 'installing';
      case 'complete':
        return 'complete';
      case 'error':
        return 'error';
      default:
        return 'checking';
    }
  };

  // Handle completion or next steps based on current status
  const handleComplete = () => {
    if (updateStatus.status === 'complete') {
      // Update is complete, restart will be handled automatically
      // No need to do anything here as the restart is scheduled in useUpdateManager
    } else if (updateStatus.status === 'error') {
      // On error, hide the overlay
      hideUpdateOverlay();
    } else if (updateStatus.status === 'available') {
      // If update is available and not yet downloading, start the download
      downloadUpdate();
    } else {
      // For other states, just hide the overlay
      hideUpdateOverlay();
    }
  };

  return (
    <UpdateOverlay
      isVisible={isUpdateOverlayVisible}
      status={mapStatusToUiStatus()}
      progress={updateStatus.progress}
      error={updateStatus.error}
      onComplete={handleComplete}
    />
  );
}
