import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccountActions } from './useAccountActions';
import { useAccountByID } from './useAccountByID';
import { useDateTime } from './useDateTime';
import { usePrice } from './usePrice';

export function useOverlayAccount(username: string | undefined) {
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  // First check user store for account
  const account = user?.rentedAccounts?.find(account => account.username.toLowerCase() === username?.toLowerCase());
  const { calculateTimeRemaining, getSecondsRemaining } = useDateTime();
  const initialRentalTime = account ? getSecondsRemaining(account) : 0;
  // If not in store or we need to refresh, fetch directly
  const { isRentedLoading } = useAccountByID({
    username,
  });
  const isAccountLoading = !account && (isRentedLoading || username === undefined);

  const { price, getAccountPrice, isPriceLoading } = usePrice();

  // Optimistic update function for the cache

  const onAccountChange = async () => {
    // Still invalidate queries for background refresh
    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const { handleExtendAccount: originalExtendAccount, isExtendPending, selectedExtensionIndex }
    = useAccountActions({ account, onAccountChange, user: user! });

  // Enhanced extend function with optimistic updates
  const handleExtendAccount = async (extensionIndex: number) => {
    try {
      // Then perform the actual API call in the background
      originalExtendAccount(extensionIndex);
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
