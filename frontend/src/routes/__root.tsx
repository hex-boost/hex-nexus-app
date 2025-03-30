import { ErrorPage } from '@/components/error-page.tsx';
import { WindowControls } from '@/components/WindowControls.tsx';

import { Route as DashboardRoute } from '@/routes/_protected/dashboard/index.tsx';
import { useUserStore } from '@/stores/useUserStore';
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import React from 'react';

export type RouterContext = {
  auth: {
    isAuthenticated: () => boolean;
  };
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: ErrorPage, // Adicionando o componente de erro
  notFoundComponent: () => {
    return <div>Page not found</div>;
  },

  beforeLoad: async ({ location }) => {
    const isAuthenticated = useUserStore.getState().isAuthenticated();
    const isLoginRoute = location.pathname === '/login';

    // Se não estiver autenticado e tentar acessar qualquer rota exceto login
    if (!isAuthenticated && !isLoginRoute) {
      throw redirect({
        to: '/login',
      });
    }

    // Se estiver autenticado e tentar acessar login
    if (isAuthenticated && isLoginRoute) {
      throw redirect({
        to: DashboardRoute.fullPath,
      });
    }

    return { isAuthenticated };
  },
});

function RootLayout() {
  // Este é seu layout base, que apenas renderiza o conteúdo
  // sem elementos visuais adicionais
  return (
    <>

      <div className="flex flex-col h-screen">

        <div
          className=" bg-card border-b"
          style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
        >
          <WindowControls className="px-4 py-2" />
        </div>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  );
}
