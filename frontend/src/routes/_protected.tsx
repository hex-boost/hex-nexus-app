import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout.tsx';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Events } from '@wailsio/runtime';

export const Route = createFileRoute('/_protected')({
  component: DashboardLayout,
});

function DashboardLayout() {
  Events.On(Events.Types.Windows.WindowClosing, async (ev) => {
    console.log(ev);
  });
  return (
    <>

      <AdminPanelLayout>
        <div className="p-6 ">
          <Outlet />
        </div>
      </AdminPanelLayout>

    </>
  );
}
