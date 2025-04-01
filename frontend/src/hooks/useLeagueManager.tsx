// frontend/src/hooks/useLeagueManager.tsx
import type { AccountType } from '@/types/types';
import { useLeagueEvents } from '@/hooks/useLeagueEvents';
import { RiotClient } from '@riot';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Duration } from '../../bindings/time/index';

export function useLeagueManager({
  account,
}: {
  account: AccountType;
}) {
  const { clientInfo, updateAuthState } = useLeagueEvents();

  const { mutate: handleOpenCaptchaWebview } = useMutation<any, {}>({
    mutationKey: ['account', 'solveCaptcha', account.id],
    mutationFn: async () => {
      updateAuthState('WAITING_CAPTCHA');
      await RiotClient.InitializeCaptchaHandling();
      await RiotClient.GetWebView();

      const captchaResponse = await RiotClient.WaitAndGetCaptchaResponse(Duration.Second * 120);
      updateAuthState('WAITING_LOGIN');
      await RiotClient.LoginWithCaptcha(account.username, account.password, captchaResponse);
      await RiotClient.WaitUntilUserinfoIsReady(Duration.Second * 20);
    },
    onSuccess: () => {
      updateAuthState('LOGIN_SUCCESS');
      toast.success('Autenticado com sucesso');
    },
    onError: (error: string) => {
      updateAuthState('', error as string);

      if (error === 'captcha_not_allowed') {
        toast.error('O captcha expirou ou foi rejeitado', {
          description: 'É necessário resolver novamente o captcha para continuar.',
          action: {
            label: 'Tentar novamente',
            onClick: () => handleOpenCaptchaWebview(),
          },
          duration: 10000,
        });
      } else {
        toast.error('Erro na autenticação', {
          description: () => <span>{error}</span>,
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
      updateAuthState('');
      await RiotClient.Launch();
      await RiotClient.WaitUntilIsRunning(Duration.Second * 10);
      await RiotClient.WaitUntilAuthenticationIsReady(Duration.Second * 20);
    },
    onSuccess: () => {
      toast.success('Riot Client launched successfully');
    },
    onError: () => {
      updateAuthState('');
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
    },
  });

  return {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleOpenCaptchaWebview,
    authenticationState: clientInfo.authState,
  };
}
