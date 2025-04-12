import type { AccountType, UserType } from '@/types/types';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { useDateTime } from '@/hooks/useDateTime.ts';
import { useGoFunctions } from '@/hooks/useGoBindings.ts';
import { usePrice } from '@/hooks/usePrice.ts';
import { useRiotAccount } from '@/hooks/useRiotAccount.ts';
import { strapiClient } from '@/lib/strapi';
import { useUserStore } from '@/stores/useUserStore.ts';
import { AccountMonitor } from '@league';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export function useAccountActions({
  account,
  user,
}: {
  account?: AccountType;
  user?: UserType;
  onAccountChange: () => Promise<void>;
}) {
  const { Utils } = useGoFunctions();
  const queryClient = useQueryClient();
  const { price, getAccountPrice } = usePrice();
  const { addTimeToExpiry } = useDateTime();
  const { currentRanking } = useRiotAccount({ account });
  const [isNexusAccount, setIsNexusAccount] = useState(false);
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [selectedExtensionIndex, setSelectedExtensionIndex] = useState<number>(1);

  const updateAccountCacheOptimistically = (extensionIndex: number) => {
    if (!account || !price) {
      return;
    }

    const extensionOption = getAccountPrice(price, currentRanking?.elo)[extensionIndex];
    if (!extensionOption) {
      return;
    }

    const secondsToAdd = extensionOption.hours * 3600;
    const cost = extensionOption.price;

    // Update accounts cache
    queryClient.setQueryData(['accounts'], (oldData: any) => {
      if (!oldData) {
        return oldData;
      }

      return {
        ...oldData,
        data: oldData.data.map((acc: AccountType) => {
          if (acc.documentId === account.documentId) {
            // Calculate new expiry time
            const mostRecentAction = acc.actionHistory.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0];

            const updatedExpiry = addTimeToExpiry(
              mostRecentAction?.expirationDate.toString(),
              secondsToAdd,
            );

            return {
              ...acc,
              actionHistory: [
                ...acc.actionHistory,
                {
                  ...mostRecentAction,
                  expirationDate: new Date(updatedExpiry),
                  createdAt: new Date(),
                },
              ],
            };
          }
          return acc;
        }),
      };
    });

    // Update user store with reduced coins
    if (user) {
      const updatedUser = {
        ...user,
        coins: Math.round(Number((user.coins || 0) - cost)),
      };
      useUserStore.getState().setUser(updatedUser);
    }
  };

  async function handleDropDialogOpen(open: boolean) {
    const isAccountNexus = await AccountMonitor.IsNexusAccount();
    console.log('isNexusAccount', isAccountNexus);
    if (isAccountNexus) {
      const currentLoggedInSummonerName = await AccountMonitor.GetLoggedInUsername();

      console.log('currentLoggedInSummoner', currentLoggedInSummonerName);
      if (currentLoggedInSummonerName === account?.username) {
        setIsNexusAccount(true);
      }
    }
    setIsDropDialogOpen(open);
  }

  // Helper function to consistently invalidate all related queries
  const invalidateRelatedQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['accounts'] });

    // Add a delay before invalidating users/me to give backend time to update
    setTimeout(async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    }, 2000); // 1 second delay, adjust as needed
  };
  const {
    data: dropRefund,
  } = useQuery({
    queryKey: ['accounts', 'refund', account?.id],
    queryFn: () => strapiClient.find<{
      amount: number;
    }>(`accounts/${account?.documentId}/refund`).then(res => res.data),
    enabled: account?.user?.documentId === user?.documentId,
    staleTime: 0,
  });

  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<{ message: string }, StrapiError>({
    mutationKey: ['accounts', 'drop', account?.documentId],
    mutationFn: async () => {
      setIsDropDialogOpen(false);

      const response = await strapiClient.request<{
        message: string;
      }>('post', `accounts/${account?.documentId}/drop`);

      return response;
    },
    onSuccess: (data) => {
      invalidateRelatedQueries();
      Utils.ForceCloseAllClients();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.error.message);
    },
  });

  const { mutate: handleExtendAccount, isPending: isExtendPending } = useMutation({
    mutationKey: ['accounts', 'extend', account?.documentId],
    mutationFn: async (timeIndex: number) => {
      setSelectedExtensionIndex(timeIndex);
      return toast.promise(
        (async () => {
          return await strapiClient.request<{
            message: string;
          }>('put', `accounts/${account?.documentId}/extend`, {
            data: {
              game: 'league',
              timeEnum: timeIndex,
            },
          });
        })(),
        {
          loading: 'Extending account...',
          success: data => data.message || 'Account extended successfully',
          error: error => error.error?.message || 'This feature is not implemented yet',
        },
      );
    },
    onMutate: async (timeIndex) => {
      // Optimistically update the UI before the actual API call
      updateAccountCacheOptimistically(timeIndex);
    },
    onSuccess: () => {
      invalidateRelatedQueries();
    },
    onError: () => {
      // Revert optimistic updates on error
      invalidateRelatedQueries();
    },
  });

  const { mutate: handleRentAccount, isPending: isRentPending } = useMutation<
    { message: string },
    StrapiError,
    number
  >({
    mutationKey: ['accounts', 'rent', account?.documentId],
    mutationFn: async (timeIndex: number) => {
      setIsDropDialogOpen(false);

      const response = strapiClient.request<{
        message: string;
      }>('post', `accounts/${account?.documentId}/rentals`, {
        data: {
          game: 'league',
          time: timeIndex,
        },
      });

      return response;
    },
    onSuccess: async (data, variables) => {
      updateAccountCacheOptimistically(variables);
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
    handleDropDialogOpen,
    isExtendPending,
    dropRefund,
    isNexusAccount,
    updateAccountCacheOptimistically,
  };
}
