import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

export function DefaultContextMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // If there's a custom menu active, just render children without the default menu
  const handleBack = () => {
    router.history.back();
  };

  const handleForward = () => {
    router.history.forward();
  };

  const handleReload = () => {
    try {
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Erro ao tentar recarregar a página:', error);
    }
  };

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
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleReload} className="flex items-center space-x-2">
          <RefreshCw className="size-4" />
          <span>Reload</span>
          <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
