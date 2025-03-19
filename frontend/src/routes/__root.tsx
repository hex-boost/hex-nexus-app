import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout';
import { LoginForm } from '@/components/login-form';

import { Toaster } from '@/components/ui/sonner.tsx';
import { useUserStore } from '@/stores/useUserStore';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export type RouterContext = {
  auth: {
    isAuthenticated: () => boolean;
  };
};
export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    const { isAuthenticated } = useUserStore();
    return (
      <>
        <Toaster />

        <TanStackRouterDevtools />
        {isAuthenticated()
          ? (
              <AdminPanelLayout>
                <div className="p-6 ">
                  <Outlet />
                </div>
              </AdminPanelLayout>
            )
          : (

              <div className=" min-h-screen  flex items-center justify-center  bg-background ">
                <LoginForm />
              </div>

            )}
      </>
    );
  },
});
