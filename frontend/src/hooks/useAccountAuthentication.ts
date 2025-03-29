import type { AccountType } from '@/types/types';
import { AuthenticateWithCaptcha } from '@riot';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InitializeConnection, WaitInventoryIsReady, WaitUntilReady } from '../../wailsjs/go/league/LCUConnection.js';
import { UpdateSummonerFromLCU } from '../../wailsjs/go/league/Service.js';

export function useAccountAuthentication({
  account,
  jwt,
}: {
  account: AccountType;
  jwt: string | null;
}) {
  const { mutate: handleSummonerUpdate } = useMutation<any, string>({
    mutationKey: ['summoner', 'update', account.id],
    mutationFn: async () => {
      await WaitUntilReady();
      await InitializeConnection();
      await WaitInventoryIsReady();
      await UpdateSummonerFromLCU(account.username, account.password, jwt!);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const { mutate: handleLoginToAccount, isPending: isLoginPending } = useMutation<any, string>({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      await AuthenticateWithCaptcha(account.username, account.password);
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
