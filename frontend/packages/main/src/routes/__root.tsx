import { ErrorPage } from '@/components/error-page.tsx';
import { Button } from '@/components/ui/button.tsx';
import { PremiumPaymentModal } from '@/features/payment/PremiumPaymentModal.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage.tsx';
import { useGoState } from '@/hooks/useGoBindings.ts';
import { getSkinSelections } from '@/lib/champion-skin-store';
import { logger } from '@/lib/logger.ts';
import { usePremiumPaymentModalStore } from '@/stores/usePremiumPaymentModalStore';
import { useUserStore } from '@/stores/useUserStore';
import { BaseClient } from '@client';
import { State as LolSkinState, Service } from '@lolskin';
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
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
  const { isOpen, tier, paymentMethod, amount, close, currency } = usePremiumPaymentModalStore();
  const [isLolskinEnabled] = useLocalStorage<boolean>('lolskin-enabled', false);
  const { jwt, user, isAuthenticated } = useUserStore();

  useGoState();
  useEffect(() => {
    if (jwt) {
      BaseClient.SetJWT(jwt);
    } else {
      BaseClient.ClearJWT();
    }
  }, [jwt]);
  useEffect(() => {
    // Only run if user is authenticated and premium features are available
    if (!isAuthenticated() || !user) {
      return;
    }

    const loadSavedSkins = async () => {
      if (user?.premium?.tier !== 'pro' || !isLolskinEnabled) {
        return;
      }

      logger.info('lolskin', 'Loading saved skin selections at application start');

      try {
        await Service.ToggleLolSkinEnabled(true);

        const savedSelections = await getSkinSelections();

        if (savedSelections.length > 0) {
          // This will update the state but not immediately trigger injection
          for (const selection of savedSelections) {
            await LolSkinState.SetChampionSkin(
              selection.championId,
              selection.skinNum,
              selection.chromaId,
            );
          }

          // After updating all selections, trigger a single injection
          await Service.StartInjection();
          toast.success(`${savedSelections.length} saved skins have been applied`);
          logger.info('lolskin', `Applied ${savedSelections.length} saved skin selections`);
        }
      } catch (error) {
        console.error('Failed to load saved skin selections:', error);
        toast.error('Failed to load your saved skin selections');
        logger.error('lolskin', 'Failed to load saved skin selections', error);
      }
    };

    // Load skins after auth is confirmed and if feature is enabled
    if (isLolskinEnabled) {
      loadSavedSkins();
    }
  }, [isAuthenticated, user, isLolskinEnabled]);
  return (
    <>
      {
        import.meta.env.VITE_NODE_ENV === 'development' && (
          <Button onClick={() => {
            throw new Error('Sentry test error');
          }}
          >
            Send Sentry Error
          </Button>
        )
      }
      <PremiumPaymentModal currency={currency} isOpen={isOpen} tier={tier} paymentMethod={paymentMethod} amount={amount} onClose={close} />
      <Outlet />
    </>
  );
}
