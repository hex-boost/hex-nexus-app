import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useContextMenu } from '@/hooks/useContextMenu.ts';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, LogOut, RefreshCw } from 'lucide-react';

export function DefaultContextMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout } = useUserStore();
  const { handleReload, isReloading } = useContextMenu();
  // If there's a custom menu active, just render children without the default menu
  const handleBack = () => {
    router.history.back();
  };

  const handleForward = () => {
    router.history.forward();
  };

  function handleLogout() {
    logout();
    router.navigate({ to: '/login' });
  }
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
        <ContextMenuItem disabled={isReloading} onClick={() => handleReload()} className="flex items-center space-x-2">
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
