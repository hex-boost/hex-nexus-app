import type { AccountType } from '@/types/types';
import { LCUConnection, SummonerService } from '@league';
import { RiotClient } from '@riot';
import { useMutation } from '@tanstack/react-query';

import { toast } from 'sonner';
import { Duration } from '../../bindings/time/index';
import {useState} from "react";

export function useLeagueManager({
  account,
}: {
  account: AccountType;
}) {
  const { mutate: handleSummonerUpdate } = useMutation<any, string>({
    mutationKey: ['summoner', 'update', account.id],
    mutationFn: async () => {
      await LCUConnection.WaitUntilReady();
      await LCUConnection.InitializeConnection();
      await LCUConnection.WaitInventoryIsReady();
      await SummonerService.UpdateFromLCU(account.username, account.password);
    },
    onError: (error) => {
      console.error(error);
    },
  });
  const [authenticationState,setAuthenticationState] = useState<'WAITING_CAPTCHA' | 'WAITING_LOGIN'>('');
  const { mutate: handleOpenCaptchaWebview   } = useMutation({
    mutationKey: ['account', 'solveCaptcha', account.id],
    mutationFn: async () => {
      await RiotClient.Initialize();
      await RiotClient.GetWebView();

        setAuthenticationState("WAITING_CAPTCHA")
      await RiotClient.(Duration.Second * 120); // timeout de 2 minutos
        setAuthenticationState("WAITING_LOGIN")
    },
    onSuccess: () => {
      toast.success('Captcha resolvido com sucesso');
      // Continue o fluxo após resolver o captcha
      handleLoginToAccount();
    },
    onError: (error) => {
      toast.error('Erro ao resolver captcha');
      console.error('erro captcha', error);
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

  const { mutate: handleLoginToAccount, isPending: isLoginPending } = useMutation<any, string>({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      await RiotClient.Initialize();
    },
    onError: (error) => {
      toast.error('Error logging in to account');
      console.error('error logging', error);
    },
    onSuccess: () => {
      toast.success('Successfully logged in to account');
      handleSummonerUpdate();
    },
  });

  return {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleLoginToAccount,
    isLoginPending,
    handleOpenCaptchaWebview,
    isCaptchaSolvingPending,
  };
}
