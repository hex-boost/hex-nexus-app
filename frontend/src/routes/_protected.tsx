import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout.tsx';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected')({
  component: DashboardLayout,
});

function DashboardLayout() {
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
