import { Sidebar } from '@/components/admin-panel/sidebar';
import { useSidebar } from '@/hooks/use-sidebar';
import { useStore } from '@/hooks/use-store';
import { cn } from '@/lib/utils';

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useSidebar, x => x);
  if (!sidebar) {
    return null;
  }
  const { getOpenState, settings } = sidebar;
  return (
    <>
      <Sidebar />
      <main
        className={cn(
          '',
          !settings.disabled && (!getOpenState() ? 'ml-[90px]' : 'ml-72'),
        )}
      >
        {children}
      </main>
    </>
  );
}
