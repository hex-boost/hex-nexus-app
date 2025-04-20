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

        toast.promise(queryClient.refetchQueries(), {
          loading: 'Reloading',
          success: () => {
            setIsReloading(false);
            return 'Reloaded Successfuly';
          },
          error: () => {
            return 'Reload failed';
          },
        });
      }
    } catch (error) {
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
        <ContextMenuItem onClick={() => logout} className="flex items-center space-x-2">
          <LogOut className="size-4" />
          <span>Logout</span>
        </ContextMenuItem>

      </ContextMenuContent>
    </ContextMenu>
  );
}
