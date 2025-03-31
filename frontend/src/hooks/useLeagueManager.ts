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
  const { mutate: handleOpenCaptchaWebview } = useMutation({
    mutationKey: ['account', 'solveCaptcha', account.id],
    mutationFn: async () => {
      setAuthenticationState('WAITING_CAPTCHA');
      await RiotClient.InitializeCaptchaHandling();
      await RiotClient.GetWebView();

      const captchaResponse = await RiotClient.WaitAndGetCaptchaResponse(Duration.Second * 120); // timeout de 2 minutos
      setAuthenticationState('WAITING_LOGIN');
      await RiotClient.LoginWithCaptcha(account.username, account.password, captchaResponse);
      await RiotClient.WaitUntilUserinfoIsReady(Duration.Second * 20);
    },
    onSuccess: () => {
      setAuthenticationState('LOGIN_SUCCESS');
      toast.success('Authenticated succesfully');
      // Continue o fluxo após resolver o captcha
      // handleLoginToAccount();
    },
    onError: (error) => {
      setAuthenticationState('');
      setClientState(CLIENT_STATES.CHECKING);
      toast.error('Error on authentication');
      console.error('error on authentication', error);
    },
  });
  const { mutate: handleLaunchRiotClient, isPending: isLaunchRiotClientPending } = useMutation({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      await RiotClient.Launch();
      await RiotClient.WaitUntilAuthenticationIsReady(Duration.Second * 20);
    },
    onSuccess: () => {
      toast.success('Riot Client launched successfully');
    },
  });

  return {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleOpenCaptchaWebview,
    authenticationState,
  };
}
