import UpdateOverlay from '@/components/update-animation/update-overlay.tsx';
import { useUpdateManager } from '@/hooks/useUpdateManager.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    updateStatus,
    downloadUpdate,
    restartApplication,
    installUpdate,
  } = useUpdateManager();

  // Map the frontend status to the UI component status

  // Handle completion or next steps based on current status
  const handleComplete = async () => {
    if (updateStatus.status === 'complete') {
      await restartApplication();
    } else if (updateStatus.status === 'error') {
      console.error('Error during update:', updateStatus);
    } else if (updateStatus.status === 'available') {
      const result = await downloadUpdate();

      await installUpdate(result?.downloadPath as string, result?.version as string);
    }
  };

  return (
    <UpdateOverlay
      status={updateStatus.status}
      progress={updateStatus.progress}
      error={updateStatus.error}
      onComplete={handleComplete}
    />
  );
}
