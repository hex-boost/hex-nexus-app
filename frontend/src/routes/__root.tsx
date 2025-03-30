import { ErrorPage } from '@/components/error-page.tsx';
import { Route as DashboardRoute } from '@/routes/_protected/index.tsx';
import { useUserStore } from '@/stores/useUserStore';
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';

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
  return <Outlet />;
}
