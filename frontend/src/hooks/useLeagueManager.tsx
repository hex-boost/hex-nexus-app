import type { AccountType } from '@/types/types';
import { useGoState } from '@/hooks/useGoBindings.ts';
import { useLeagueState } from '@/hooks/useLeagueState.tsx';
import { logger } from '@/lib/logger';
import { useAccountStore } from '@/stores/useAccountStore.ts';
import { ClientMonitor } from '@league';
import { RiotClient } from '@riot';
import { useMutation } from '@tanstack/react-query';
import { Call } from '@wailsio/runtime';
import { toast } from 'sonner';
import { Duration } from '../../bindings/time/index';

export function useLeagueManager({
  account,
}: {
  account: AccountType;
}) {
  const { Utils } = useGoState();
  const { setIsNexusAccount } = useAccountStore();
  const { state, isLoading } = useLeagueState();
  const logContext = `useLeagueManager:${account.id}`;

  logger.info(logContext, 'Hook initialized', {
    accountId: account.id,
    username: account.username,
    currentState: state,
  });

  const { mutate: handleOpenCaptchaWebview, isPending: isCaptchaProcessing } = useMutation({
    mutationKey: ['account', 'solveCaptcha', account.id],
    mutationFn: async () => {
      logger.info(logContext, 'Starting captcha handling flow', { username: account.username });

      logger.info(logContext, 'Opening captcha web view and waiting for token');

      try {
        const captchaToken = await ClientMonitor.OpenWebviewAndGetToken();

        logger.info(logContext, 'Captcha token received, proceeding with login');

        await ClientMonitor.HandleLogin(account.username, account.password, captchaToken);

        logger.info(logContext, 'Waiting for user info (timeout: 10s)');
        await RiotClient.WaitUntilUserinfoIsReady(Duration.Second * 10);
        logger.info(logContext, 'User info ready, login process completed');
      } catch (error) {
        logger.error(logContext, 'Error during captcha flow', { error });
        throw error;
      }
    },
    onSuccess: () => {
      setIsNexusAccount(true);
      logger.info(logContext, 'Login with captcha successful');
      toast.success('Authenticated successfully');
    },
    onError: (error) => {
      if (error instanceof Call.RuntimeError) {
        logger.error(logContext, 'Login with captcha failed', error);

        if (error.message.includes('captcha_already_in_progress')) {
          logger.warn(logContext, 'Another captcha flow is already in progress');
          toast.info('Captcha is already being processed', {
            description: 'Please wait for the current captcha to finish',
            duration: 5000,
          });
          return;
        }

        if (error.message.includes('captcha_timeout')) {
          logger.warn(logContext, 'Captcha timed out');
          toast.info('Captcha timed out', {
            description: 'Do you want to try again?',
            action: {
              label: 'Try again',
              onClick: () => {
                logger.info(logContext, 'User requested to retry captcha flow');
                // Short delay before retry to ensure resources are cleaned up
                setTimeout(() => handleOpenCaptchaWebview(), 1000);
              },
            },
            duration: 10000,
          });
          return;
        }
        if (error.message.includes('captcha_cancelled')) {
          logger.warn(logContext, 'Captcha cancelled by user');
          toast.info('Window has been closed', {
            description: 'Do you want to try again?',
            action: {
              label: 'Try again',
              onClick: () => {
                logger.info(logContext, 'User requested to retry captcha flow');
                // Short delay before retry to ensure resources are cleaned up
                setTimeout(() => handleOpenCaptchaWebview(), 1000);
              },
            },
            duration: 10000,
          });
          return;
        }
        if (error.message.includes('captcha_not_allowed')) {
          logger.warn(logContext, 'Captcha expired or rejected');
          toast.warning('Captcha got expired or has been rejected', {
            description: 'Sometimes it just works on the second try',
            action: {
              label: 'Try again',
              onClick: () => {
                logger.info(logContext, 'User requested to retry captcha flow');
                // Short delay before retry to ensure resources are cleaned up
                setTimeout(() => handleOpenCaptchaWebview(), 1000);
              },
            },
            duration: 10000,
          });
          return;
        }
      }

      // Generic error handler
      logger.error(logContext, 'Authentication error', error);
      toast.warning('Error authenticating', {
        action: {
          label: 'Try again',
          onClick: () => {
            logger.info(logContext, 'User requested to retry authentication');
            // Short delay before retry to ensure resources are cleaned up
            setTimeout(() => handleOpenCaptchaWebview(), 1000);
          },
        },
        duration: 10000,
      });
    },
  });

  const { mutate: handleLaunchRiotClient, isPending: isLaunchRiotClientPending } = useMutation({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      logger.info(logContext, 'Launching Riot Client', { accountId: account.id });

      // Backend now controls state
      await ClientMonitor.LaunchClient();

      logger.info(logContext, 'Waiting for authentication to be ready (timeout: 20s)');
      await ClientMonitor.WaitUntilAuthenticationIsReady(Duration.Second * 15);

      logger.info(logContext, 'Riot Client successfully launched and ready');
    },
    onSuccess: () => {
      logger.info(logContext, 'Riot Client launch completed successfully');
      toast.info('Riot Client launched successfully');
    },
    onError: (error) => {
      if (error instanceof Call.RuntimeError) {
        logger.error(logContext, 'Failed to launch Riot Client', error.message);

        toast.warning('An error ocurred', {
          action: {
            label: 'Force close',
            onClick: async () => {
              try {
                logger.info(logContext, 'User requested to force close all Riot clients');
                await Utils.ForceCloseAllClients();
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
      }
    },
  });

  return {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleOpenCaptchaWebview,
    isCaptchaProcessing,
    clientState: state?.clientState || 'CLOSED',
    isStateLoading: isLoading,

  };
}
