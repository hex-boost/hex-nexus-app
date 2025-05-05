import { useQueryClient } from '@tanstack/react-query';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useContextMenu() {
  const queryClient = useQueryClient();
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async (closeTime?: number) => {
    try {
      if (!isReloading) {
        setIsReloading(true);

        // Create an AbortController to cancel queries
        const controller = new AbortController();
        const signal = controller.signal;

        // Show a loading toast with cancel button
        const toastId = toast.loading('Reloading', {
          action: {
            label: 'Cancel',
            onClick: () => {
              controller.abort();
              queryClient.cancelQueries();
              setIsReloading(false);
              toast.dismiss(toastId);
              toast.info('Reload canceled');
            },
          },
        });

        // Create a promise that refetches all queries with the signal
        const allQueriesPromise = queryClient.refetchQueries({
          type: 'active',
          predicate: query => !query.queryKey.includes('accounts'),
        });

        // Handle accounts queries separately with the specific parameters
        const accountsPromise = queryClient.refetchQueries({
          exact: false,
          type: 'active',
          queryKey: ['accounts'],
        });

        // Handle the promise resolution manually
        try {
          await Promise.all([allQueriesPromise, accountsPromise]);
          toast.success('Reloaded Successfully', { id: toastId, duration: closeTime || 1000 });
        } catch (err) {
          if (signal.aborted) {
            // Already handled by the cancel button
          } else {
            toast.error('Reload failed', { id: toastId });
          }
        } finally {
          setIsReloading(false);
        }
      }
    } catch (error) {
      setIsReloading(false);
      console.error('Erro ao tentar recarregar a página:', error);
    }
  };
  useEffect(() => {
    const cancel = Events.On('page:reload', () => {
      handleReload();
    });

    return () => {
      cancel();
    };
  }, [isReloading]);

  return {
    handleReload,
    isReloading,
  };
}
