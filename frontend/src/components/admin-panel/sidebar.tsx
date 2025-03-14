import logoHexBoost from '@/assets/logo-hex-boost.svg';
import { Menu } from '@/components/admin-panel/menu';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';
import { useStore } from '@/hooks/use-store';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';

export function Sidebar() {
  const sidebar = useStore(useSidebar, x => x);
  if (!sidebar) {
    return null;
  }
  const { getOpenState, settings } = sidebar;
  return (
    <aside
      className={cn(
        'fixed bg-black/20 border-r-1 top-0 left-0 z-20 h-screen translate-x-0 transition-[width] ease-in-out duration-300',
        !getOpenState() ? 'w-[90px]' : 'w-72',
        settings.disabled && 'hidden',
      )}
    >
      <div
        className="relative h-full flex flex-col px-3 py-4 overflow-y-hidden shadow-md dark:shadow-muted"
      >
        <Button
          className={cn(
            'transition-transform ease-in-out duration-300 mb-1',
            !getOpenState() ? 'translate-x-1' : 'translate-x-0',
          )}
          variant="link"
          asChild
        >
          <Link to="/" className="flex items-center gap-2">
            <img src={logoHexBoost} alt="Logo Hex Boost" className="w-8 h-8" />
            <h1
              className={cn(
                'font-bold text-white text-lg whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300',
                !getOpenState()
                  ? '-translate-x-96 opacity-0 hidden'
                  : 'translate-x-0 opacity-100',
              )}
            >
              Hex Nexus
            </h1>
          </Link>
        </Button>
        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}
