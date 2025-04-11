import type { AccountType, UserType } from '@/types/types';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { useGoFunctions } from '@/hooks/useGoBindings.ts';
import { strapiClient } from '@/lib/strapi';
import { AccountMonitor } from '@league';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export function useAccountActions({
  account,
  user,
}: {
  account: AccountType;
  user?: UserType;
  onAccountChange: () => Promise<void>;
}) {
  const { Utils } = useGoFunctions();
  const queryClient = useQueryClient();

  const [isNexusAccount, setIsNexusAccount] = useState(false);
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [selectedExtensionIndex, setSelectedExtensionIndex] = useState<number>(1);

  async function handleDropDialogOpen(open: boolean) {
    const isAccountNexus = await AccountMonitor.IsNexusAccount();
    console.log('isNexusAccount', isAccountNexus);
    if (isAccountNexus) {
      const currentLoggedInSummonerName = await AccountMonitor.GetLoggedInUsername();

      console.log('currentLoggedInSummoner', currentLoggedInSummonerName);
      if (currentLoggedInSummonerName === account.username) {
        setIsNexusAccount(true);
      }
    }
    setIsDropDialogOpen(open);
  }

  // Helper function to consistently invalidate all related queries
  const invalidateRelatedQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['accounts'] });

    await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
  };

  const {
    data: dropRefund,
  } = useQuery({
    queryKey: ['accounts', 'refund', account.id],
    queryFn: () => strapiClient.find<{
      amount: number;
    }>(`accounts/${account?.documentId}/refund`).then(res => res.data),
    enabled: account.user?.documentId === user?.documentId,
    staleTime: 0,
  });

  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<{ message: string }, StrapiError>({
    mutationKey: ['accounts', 'drop', account.documentId],
    mutationFn: async () => {
      setIsDropDialogOpen(false);

      const response = await strapiClient.request<{
        message: string;
      }>('post', `accounts/${account.documentId}/drop`);

      return response;
    },
    onSuccess: (data) => {
      Utils.ForceCloseAllClients();
      invalidateRelatedQueries();
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
          const response = await strapiClient.request<{
            message: string;
          }>('post', `accounts/${account.documentId}/extend`, {
            data: {
              game: 'league',
              time: timeIndex,
            },
          });
          return response;
        })(),
        {
          loading: 'Extending account...',
          success: data => data.message || 'Account extended successfully',
          error: error => error.error?.message || 'This feature is not implemented yet',
        },
      );
    },
    onSuccess: () => {
      invalidateRelatedQueries();
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

      const response = strapiClient.request<{
        message: string;
      }>('post', `accounts/${account.documentId}/rentals`, {
        data: {
          game: 'league',
          time: timeIndex,
        },
      });

      return response;
    },
    onSuccess: async (data) => {
      await invalidateRelatedQueries();
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
