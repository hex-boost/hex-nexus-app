import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useUserStore } from '@/stores/useUserStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Events } from '@wailsio/runtime';
import { ArrowLeft, ArrowRight, LogOut, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function DefaultContextMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useUserStore();

  // If there's a custom menu active, just render children without the default menu
  const handleBack = () => {
    router.history.back();
  };

  const handleForward = () => {
    router.history.forward();
  };

  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
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
          signal,
        });

        // Handle accounts queries separately with the specific parameters
        const accountsPromise = queryClient.refetchQueries({
          exact: false,
          type: 'active',
          queryKey: ['accounts'],
          signal,
        });

        // Handle the promise resolution manually
        try {
          await Promise.all([allQueriesPromise, accountsPromise]);
          toast.success('Reloaded Successfully', { id: toastId });
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
  function handleLogout() {
    logout();
    router.navigate({ to: '/login' });
  }
  useEffect(() => {
    const cancel = Events.On('page:reload', () => {
      handleReload();
    });

    return () => {
      cancel();
    };
  }, [isReloading]);
  const canGoBack = router.history.canGoBack();
  return (
    <ContextMenu>
      <ContextMenuTrigger className="">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleForward} className="flex items-center space-x-2">
          <ArrowRight className="size-4" />
          <span>Forward</span>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canGoBack}
          onClick={handleBack}
          className="flex items-center  space-x-2"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </ContextMenuItem>
        <ContextMenuItem disabled={isReloading} onClick={handleReload} className="flex items-center space-x-2">
          <RefreshCw className="size-4" />
          <span>Reload</span>
          <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleLogout()} className="flex items-center space-x-2 text-red-300">
          <LogOut className="size-4" />
          <span>Logout</span>
        </ContextMenuItem>

      </ContextMenuContent>
    </ContextMenu>
  );
}
