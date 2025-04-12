import type { AccountType } from '@/types/types.ts';
import { useRiotAccount } from '@/hooks/useRiotAccount.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAccountActions } from './useAccountActions';
import { useAccountByID } from './useAccountByID';
import { useDateTime } from './useDateTime';
import { usePrice } from './usePrice';

export function useOverlayAccount(username: string | undefined) {
  const { user } = useUserStore();
  const [initialRentalTime, setInitialRentalTime] = useState(0);
  const queryClient = useQueryClient();

  // First check user store for account
  const storeAccount = user?.rentedAccounts?.find(account => account.username === username) as AccountType;

  // If not in store or we need to refresh, fetch directly
  const { rentedAccounts, isRentedLoading } = useAccountByID({
    username,
  });
  const { currentRanking } = useRiotAccount({ account: storeAccount });
  // Use account from store or from direct fetch
  const account = storeAccount || (rentedAccounts && rentedAccounts[0]) as AccountType | undefined;
  const isAccountLoading = !account && (isRentedLoading || username === undefined);

  const { calculateTimeRemaining, getSecondsRemaining, addTimeToExpiry } = useDateTime();

  const { price, getAccountPrice, isPriceLoading } = usePrice();

  // Optimistic update function for the cache
  const updateAccountCacheOptimistically = (extensionIndex: number) => {
    if (!account || !price) {
      return;
    }

    const extensionOption = getAccountPrice(price, currentRanking.elo)[extensionIndex];
    if (!extensionOption) {
      return;
    }

    const secondsToAdd = extensionOption.hours / 3600;
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
            const expiryDate = account.actionHistory.find(action => action.type === 'claim' && user?.id === action.user.id)?.expirationDate as Date;
            const updatedExpiry = addTimeToExpiry(expiryDate.toString(), secondsToAdd);

            return {
              ...acc,
              rentalExpiry: updatedExpiry,
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
        coins: (user.coins || 0) - cost,
      };
      useUserStore.getState().setUser(updatedUser);
    }
  };

  const onAccountChange = async () => {
    // Still invalidate queries for background refresh
    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const { handleExtendAccount: originalExtendAccount, isExtendPending, selectedExtensionIndex }
    = useAccountActions({ account, onAccountChange, user: user! });

  // Enhanced extend function with optimistic updates
  const handleExtendAccount = async (extensionIndex: number) => {
    // Immediately update the cache optimistically
    updateAccountCacheOptimistically(extensionIndex);

    try {
      // Then perform the actual API call in the background
      await originalExtendAccount(extensionIndex);
      // Successful - cache will be refreshed by the invalidateQueries in onAccountChange
    } catch (error) {
      console.error('Account extension failed:', error);
      // Revert optimistic updates by invalidating the cache
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      // Could also add error notification here
    }
  };

  // Fetch refund amount with proper null checks
  const {
    data: dropRefund,
    isLoading: isRefundLoading,
  } = useQuery({
    queryKey: ['accounts', 'refund', account?.documentId],
    queryFn: () => strapiClient.find<{
      amount: number;
    }>(`accounts/${account?.documentId}/refund`).then(res => res.data),
    enabled: !!account?.documentId && account?.user?.documentId === user?.documentId,
    staleTime: 0,
  });

  // Set the active account once data is loaded
  useEffect(() => {
    if (account) {
      const seconds = getSecondsRemaining(account);
      setInitialRentalTime(seconds);
    }
  }, [account]);

  return {
    account,
    initialRentalTime,
    calculateTimeRemaining,
    handleExtendAccount,
    isExtendPending,
    selectedExtensionIndex,
    price,
    getAccountPrice,
    isPriceLoading,
    isAccountLoading,
    dropRefund,
    isRefundLoading,
  };
}
