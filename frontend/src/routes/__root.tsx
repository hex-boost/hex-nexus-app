import { ErrorPage } from '@/components/error-page.tsx';
import { useUserStore } from '@/stores/useUserStore';
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';

export type RouterContext = {
  auth: {
    isAuthenticated: () => boolean;
  };
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: ErrorPage,
  notFoundComponent: () => <div>Page not found</div>,

  beforeLoad: async ({ location }) => {
    const isAuthenticated = useUserStore.getState().isAuthenticated();

    const isLoginRoute = location.pathname === '/login';
    const params = new URLSearchParams(window.location.search);
    const targetRoute = params.get('target');

    if (targetRoute === 'overlay') {
      throw redirect({ to: '/overlay' });
    }
    // Don't redirect for overlay route

    if (!isAuthenticated && !isLoginRoute) {
      throw redirect({ to: '/login' });
    }
    if (isAuthenticated && isLoginRoute) {
      throw redirect({ to: '/dashboard' });
    }
    return { isAuthenticated };
  },
});

function RootLayout() {
  return (
    <>
      <Outlet />

    </>
  );
}
