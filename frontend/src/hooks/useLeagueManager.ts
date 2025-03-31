import type { AccountType } from '@/types/types';
import { LCUConnection, SummonerService } from '@league';
import { Client } from '@riot';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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

  const { mutate: handleLoginToAccount, isPending: isLoginPending } = useMutation<any, string>({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      await Client.Authenticate(account.username, account.password);
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
    handleLoginToAccount,
    isLoginPending,
  };
}
