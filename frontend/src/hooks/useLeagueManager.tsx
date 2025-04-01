import type { AccountType } from '@/types/types';
import { CLIENT_STATES, useLeagueEvents } from '@/hooks/useLeagueEvents.ts';
import { RiotClient } from '@riot';
import { useMutation } from '@tanstack/react-query';

import { useState } from 'react';
import { toast } from 'sonner';
import { Duration } from '../../bindings/time/index';

export function useLeagueManager({
  account,
}: {
  account: AccountType;
}) {
  const { setClientState } = useLeagueEvents();

  // const { mutate: handleSummonerUpdate } = useMutation<any, string>({
  //   mutationKey: ['summoner', 'update', account.id],
  //   mutationFn: async () => {
  //     await LCUConnection.WaitUntilReady();
  //     await LCUConnection.InitializeConnection();
  //     await LCUConnection.WaitInventoryIsReady();
  //     await SummonerService.UpdateFromLCU(account.username, account.password);
  //   },
  //   onError: (error) => {
  //     console.error(error);
  //   },
  // });
  const [authenticationState, setAuthenticationState] = useState<'WAITING_CAPTCHA' | 'WAITING_LOGIN' | 'LOGIN_SUCCESS' | ''>('');

  const { mutate: handleOpenCaptchaWebview } = useMutation<any, string>({
    mutationKey: ['account', 'solveCaptcha', account.id],
    mutationFn: async () => {
      setAuthenticationState('WAITING_CAPTCHA');
      await RiotClient.InitializeCaptchaHandling();
      await RiotClient.GetWebView();

      const captchaResponse = await RiotClient.WaitAndGetCaptchaResponse(Duration.Second * 120); // timeout de 2 minutos
      await RiotClient.CloseWebview();
      setAuthenticationState('WAITING_LOGIN');
      await RiotClient.LoginWithCaptcha(account.username, account.password, captchaResponse);
      await RiotClient.WaitUntilUserinfoIsReady(Duration.Second * 20);
    },
    onSuccess: () => {
      setAuthenticationState('LOGIN_SUCCESS');
      toast.success('Autenticado com sucesso');
    },
    onError: (error) => {
      setAuthenticationState('');
      setClientState(CLIENT_STATES.CHECKING);

      if (error === 'captcha_not_allowed') {
        toast.error('O captcha expirou ou foi rejeitado', {
          description: 'É necessário resolver novamente o captcha para continuar.',
          action: {
            label: 'Tentar novamente',
            onClick: () => handleOpenCaptchaWebview(),
          },
          duration: 10000, // 10 segundos para o usuário ver a notificação
        });
      } else {
        toast.error('Erro na autenticação', {
          description: () => {
            return (
              <span>
                {' '}
                {error}
                {' '}
              </span>
            );
          },
          action: {
            label: 'Tentar novamente',
            onClick: () => handleOpenCaptchaWebview(),
          },
        });
      }

      console.error('erro na autenticação', error);
    },
  });
  const { mutate: handleLaunchRiotClient, isPending: isLaunchRiotClientPending } = useMutation({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      setAuthenticationState('');

      await RiotClient.Launch();
      await RiotClient.WaitUntilIsRunning(Duration.Second * 10);
      await RiotClient.WaitUntilAuthenticationIsReady(Duration.Second * 20);
    },
    onSuccess: () => {
      toast.success('Riot Client launched successfully');
    },

    onError: () => {
      toast.error('Ocorreu um erro ao iniciar o Riot Client', {
        description: 'Pode existir outro cliente aberto impedindo a inicialização.',
        action: {
          label: 'Forçar fechamento',
          onClick: async () => {
            try {
              await RiotClient.ForceCloseAllClients();
              toast.success('Todos os clientes Riot foram fechados', {
                description: 'Tente iniciar o cliente novamente agora.',
              });
            } catch (error) {
              toast.error('Erro ao tentar fechar os clientes', {
                description: 'Tente fechá-los manualmente.',
              });
              console.error(error);
            }
          },
        },
      });

      setAuthenticationState('');
    },
  });

  return {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleOpenCaptchaWebview,
    authenticationState,
  };
}
