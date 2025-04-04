// frontend/src/hooks/useLeagueManager.tsx
import type { AccountType } from '@/types/types';
import { useLeagueState } from '@/hooks/useLeagueState.tsx';
import { logger } from '@/lib/logger';
import { LeagueAuthState } from '@/types/LeagueAuthState';
import { ClientMonitor } from '@league';
import { RiotClient } from '@riot';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Duration } from '../../bindings/time/index';

export function useLeagueManager({
  account,
}: {
  account: AccountType;
}) {
  const { state } = useLeagueState();
  const logContext = `useLeagueManager:${account.id}`;

  logger.info(logContext, 'Hook initialized', {
    accountId: account.id,
    username: account.username,
    currentState: state,
  });

  const { mutate: handleOpenCaptchaWebview } = useMutation<any, Error>({
    mutationKey: ['account', 'solveCaptcha', account.id],
    mutationFn: async () => {
      logger.info(logContext, 'Starting captcha handling flow', { username: account.username });

      // Backend now manages the auth state
      await ClientMonitor.HandleCaptcha(account.username, account.password);

      logger.info(logContext, 'Opening captcha web view');
      await RiotClient.GetWebView();

      logger.info(logContext, 'Waiting for captcha response (timeout: 120s)');

      const captchaResponse = await RiotClient.WaitAndGetCaptchaResponse(Duration.Second * 120);
      logger.info(logContext, 'Captcha response received', { responseLength: captchaResponse?.length || 0 });

      // Backend now handles login and state updates
      await ClientMonitor.HandleLogin(account.username, account.password, captchaResponse);

      logger.info(logContext, 'Waiting for user info (timeout: 20s)');
      await RiotClient.WaitUntilUserinfoIsReady(Duration.Second * 20);
      logger.info(logContext, 'User info ready, login process completed');
    },
    onSuccess: () => {
      logger.info(logContext, 'Login with captcha successful');
      toast.success('Autenticado com sucesso');
    },
    onError: (error) => {
      const errorMessage = error.message || String(error);
      logger.error(logContext, 'Login with captcha failed', { error: errorMessage });

      if (errorMessage === 'captcha_not_allowed') {
        logger.warn(logContext, 'Captcha expired or rejected');
        toast.error('O captcha expirou ou foi rejeitado', {
          description: 'É necessário resolver novamente o captcha para continuar.',
          action: {
            label: 'Tentar novamente',
            onClick: () => {
              logger.info(logContext, 'User requested to retry captcha flow');
              handleOpenCaptchaWebview();
            },
          },
          duration: 10000,
        });
      } else {
        logger.error(logContext, 'Authentication error', { error: errorMessage });
        toast.warning('Error on authentication', {
          description: () => <span>Don't </span>,
          action: {
            label: 'Try again',
            onClick: () => {
              logger.info(logContext, 'User requested to retry authentication');
              handleOpenCaptchaWebview();
            },
          },
        });
      }
    },
  });

  const { mutate: handleLaunchRiotClient, isPending: isLaunchRiotClientPending } = useMutation({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      logger.info(logContext, 'Launching Riot Client', { accountId: account.id });

      // Backend now controls state
      await ClientMonitor.LaunchClient();

      logger.info(logContext, 'Waiting for Riot Client to start running (timeout: 10s)');
      await RiotClient.WaitUntilIsRunning(Duration.Second * 10);

      logger.info(logContext, 'Waiting for authentication to be ready (timeout: 20s)');
      await RiotClient.WaitUntilAuthenticationIsReady(Duration.Second * 20);

      // Force an immediate state check to update the UI
      await ClientMonitor.GetCurrentState();

      logger.info(logContext, 'Riot Client successfully launched and ready');
    },
    onSuccess: () => {
      logger.info(logContext, 'Riot Client launch completed successfully');
      toast.success('Riot Client launched successfully');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(logContext, 'Failed to launch Riot Client', { error: errorMessage });

      toast.error('An error ocurred', {
        action: {
          label: 'Force close',
          onClick: async () => {
            try {
              logger.info(logContext, 'User requested to force close all Riot clients');
              await RiotClient.ForceCloseAllClients();
              logger.info(logContext, 'Successfully closed all Riot clients');

              toast.info('All clients closed succesfully');
            } catch (error) {
              const closeError = error instanceof Error ? error.message : String(error);
              logger.error(logContext, 'Failed to force close Riot clients', { error: closeError });

              toast.error('Error trying to close clients', {
                description: 'Please restart the app',
              });
            }
          },
        },
      });
    },
  });

  return {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleOpenCaptchaWebview,
    authenticationState: state?.authState || LeagueAuthState.NONE,
    clientState: state?.clientState || 'CLOSED',
    errorMessage: state?.errorMessage,
  };
}
