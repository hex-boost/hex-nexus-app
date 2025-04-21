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
    Exit,
  } = useUpdateManager();

  // Handle completion or next steps based on current status

  // Auto-restart when complete
  useEffect(() => {
    if (updateStatus.status === 'complete' || updateStatus.status === 'error') {
      restartApplication().then(() => {
        const timer = setTimeout(() => {
          Exit();
        }, 2000);
          // g
        console.log('Application restarted successfully');
        return () => clearTimeout(timer);
      }).catch((e) => {
        console.error('Error restarting application:', e);
      },
      );
    }
  }, [updateStatus.status, restartApplication, Exit]);

  return (
    <UpdateOverlay
      status={updateStatus.status}
      progress={updateStatus.progress}
      error={updateStatus.error}
    />
  );
}
