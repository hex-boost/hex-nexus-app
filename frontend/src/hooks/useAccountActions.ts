import type { AccountType, UserType } from '@/types/types';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { useCommonFetch } from '@/hooks/useCommonFetch.ts';
import { useGoFunctions } from '@/hooks/useGoBindings.ts';
import { strapiClient } from '@/lib/strapi';
import { AccountMonitor } from '@league';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export function useAccountActions({
  account,
  onAccountChange,
  user,
}: {
  account: AccountType;
  user?: UserType;
  onAccountChange: () => Promise<void>;
}) {
  const { refetchUser } = useCommonFetch();
  const { Utils } = useGoFunctions();

  const [isNexusAccount, setIsNexusAccount] = useState(false);
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [selectedExtensionIndex, setSelectedExtensionIndex] = useState<number>(1);

  async function handleDropDialogOpen(open: boolean) {
    const isNexusAccount = await AccountMonitor.IsNexusAccount();
    console.log('isNexusAccount', isNexusAccount);
    if (isNexusAccount) {
      const droppedAccountSummonername = `${account.gamename}#${account.tagline}`;

      console.log('droppedAccountSummonername', droppedAccountSummonername);
      const currentLoggedInSummonerName = await AccountMonitor.GetLoggedInSummonerName();

      console.log('currentLoggedInSummoner', currentLoggedInSummonerName);
      if (droppedAccountSummonername === currentLoggedInSummonerName) {
        setIsNexusAccount(true);
      }
    }
    setIsDropDialogOpen(open);
  }
  const {
    data: dropRefund,
  } = useQuery({
    queryKey: ['accounts', 'refund', account.id],
    queryFn: () => strapiClient.find<{ amount: number }>(`accounts/${account?.documentId}/refund`).then(res => res.data),
    enabled: account.user?.documentId === user?.documentId,
    staleTime: 0,
  });
  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<{ message: string }, StrapiError>({
    mutationKey: ['accounts', 'drop', account.documentId],
    mutationFn: async () => {
      setIsDropDialogOpen(false);

      const response = await strapiClient.request<{ message: string }>('post', `accounts/${account.documentId}/drop`);
      await refetchUser();
      await onAccountChange();
      return response;
    },
    onSuccess: (data) => {
      Utils.ForceCloseAllClients();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.error.message);
    },

  });

  const { mutate: handleExtendAccount, isPending: isExtendPending } = useMutation({
    mutationKey: ['accounts', 'extend', account.documentId],
    mutationFn: async (timeIndex: number) => {
      return toast.promise(
        (async () => {
          const response = await strapiClient.request<{ message: string }>('post', `accounts/${account.documentId}/extend`, {
            data: {
              game: 'league',
              time: timeIndex,
            },
          });
          await refetchUser();
          await onAccountChange();
          return response;
        })(),
        {
          loading: 'Extending account...',
          success: data => data.message || 'Account extended successfully',
          error: error => error.error?.message || 'This feature is not implemented yet',
        },
      );
    },
  });

  const { mutate: handleRentAccount, isPending: isRentPending } = useMutation<
    { message: string },
    StrapiError,
    number
  >({
    mutationKey: ['accounts', 'rent', account.documentId],
    mutationFn: async (timeIndex: number) => {
      setIsDropDialogOpen(false);

      const response = strapiClient.request<{ message: string }>('post', `accounts/${account.documentId}/rentals`, {
        data: {
          game: 'league',
          time: timeIndex,
        },
      });
      await refetchUser();
      await onAccountChange();
      return response;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setIsDropDialogOpen(false); // Reset dialog state after successful rental
    },
    onError: (error) => {
      toast.error(error.error.message);
    },
  });

  return {
    setSelectedExtensionIndex,
    selectedRentalOptionIndex,
    setSelectedRentalOptionIndex,
    handleRentAccount,
    isRentPending,

    isDropDialogOpen,
    setIsDropDialogOpen,
    selectedExtensionIndex,
    handleDropAccount,
    isDropPending,
    handleExtendAccount,
    isExtendPending,
    dropRefund,
    isNexusAccount,
    handleDropDialogOpen,
  };
}
