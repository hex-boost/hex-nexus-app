import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore';
import { useQuery } from '@tanstack/react-query';
import { useAccountActions } from './useAccountActions';
import { useAccountByID } from './useAccountByID';
import { useDateTime } from './useDateTime';
import { usePrice } from './usePrice';

export function useOverlayAccount(username: string | undefined) {
  const { user } = useUserStore();
  const account = user?.rentedAccounts?.find(account => account.username.toLowerCase() === username?.toLowerCase());
  const { calculateTimeRemaining, getSecondsRemaining } = useDateTime();
  const initialRentalTime = account ? getSecondsRemaining(account) : 0;
  // If not in store, or we need to refresh, fetch directly
  const { } = useAccountByID({
    username,
  });
  const isAccountLoading = !account && (username === undefined);

  const { price, getAccountPrice, isPriceLoading } = usePrice();

  const { handleExtendAccount, isExtendPending, selectedExtensionIndex }
    = useAccountActions({ account, user });
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
