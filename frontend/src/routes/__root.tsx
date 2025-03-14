import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { useUserStore } from '@/stores/useUserStore'
import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout'
import { LoginForm } from '@/components/login-form'
import { createRootRouteWithContext } from '@tanstack/react-router';

export type RouterContext = {
  auth: {
    isAuthenticated: () => boolean;
  }
};
export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    const { isAuthenticated } = useUserStore()
    return (
      <>
        <TanStackRouterDevtools />
        {isAuthenticated() ? (
          <AdminPanelLayout>
            <div className="p-6 ">
              <Outlet />
            </div>
          </AdminPanelLayout>
        ) : (

          <div className=" min-h-screen  flex items-center justify-center  bg-background ">
            <LoginForm />
          </div>

        )}
      </>
    )
  },
})
