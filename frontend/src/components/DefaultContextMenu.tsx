import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useContextMenu } from '@/contexts/ContextMenuContext';
import { useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function DefaultContextMenu({ children }: { children: React.ReactNode }) {
  const { hasCustomMenu } = useContextMenu();
  const router = useRouter();

  // If there's a custom menu active, just render children without the default menu
  if (hasCustomMenu) {
    return <>{children}</>;
  }
  const handleBack = () => {
    router.history.back();
  };

  const handleForward = () => {
    router.history.forward();
  };
  const canGoBack = router.history.canGoBack();

  return (
    <ContextMenu>
      <ContextMenuTrigger className="">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleForward} className="flex items-center space-x-2">
          <ArrowLeft className="size-4" />
          <span>Forward</span>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canGoBack}
          onClick={handleBack}
          className="flex items-center space-x-2"
        >
          <ArrowRight className="size-4" />
          <span>Back</span>
        </ContextMenuItem>
        {/* <ContextMenuItem onClick={() => router.invalidate()} className=""> */}
        {/*  <div className="space-x-2 flex items-center"> */}
        {/*    <RefreshCw className="size-4" /> */}
        {/*    <span>Reload</span> */}
        {/*  </div> */}
        {/* <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut> */}

        {/* </ContextMenuItem> */}
      </ContextMenuContent>
    </ContextMenu>
  );
}
