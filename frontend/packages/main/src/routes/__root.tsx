import { ErrorPage } from '@/components/error-page.tsx';
import { PremiumPaymentModal } from '@/features/payment/PremiumPaymentModal.tsx';
import { useGoState } from '@/hooks/useGoBindings.ts';
import { usePremiumPaymentModalStore } from '@/stores/usePremiumPaymentModalStore';
import { useUserStore } from '@/stores/useUserStore';
import { BaseClient } from '@client';
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import { useEffect } from 'react';
import '@wailsio/runtime';

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
  const { isOpen, tier, paymentMethod, amount, close } = usePremiumPaymentModalStore();
  useGoState();
  const { jwt } = useUserStore();
  useEffect(() => {
    if (jwt) {
      BaseClient.SetJWT(jwt);
    } else {
      BaseClient.ClearJWT();
    }
  }, [jwt]);
  return (
    <>
      <PremiumPaymentModal isOpen={isOpen} tier={tier} paymentMethod={paymentMethod} amount={amount} onClose={close} />
      <Outlet />
    </>
  );
}
