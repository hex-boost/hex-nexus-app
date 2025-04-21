// frontend/packages/updater/src/routes/index.tsx
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
    restartApplication,
  } = useUpdateManager();

  // Handle completion or next steps based on current status

  // Auto-restart when complete
  useEffect(() => {
    if (updateStatus.status === 'complete' || updateStatus.status === 'error') {
      const timer = setTimeout(() => {
        restartApplication();
      }, 2000); // Wait 2 seconds before restarting

      return () => clearTimeout(timer);
    }
  }, [updateStatus.status, restartApplication]);

  return (
    <UpdateOverlay
      status={updateStatus.status}
      progress={updateStatus.progress}
      error={updateStatus.error}
    />
  );
}
