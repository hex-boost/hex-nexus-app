import type { AccountType, RawStrapiError } from '@/types/types';
import { strapiClient } from '@/lib/strapi';
import { useAccountStore } from '@/stores/useAccountStore.ts';

import { Monitor as AccountMonitor } from '@account';

import { Manager } from '@leagueManager';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export type RefundResponse = {
  amount: number;
  remainingPercentage: number;
  totalPaidAmount: number;
};
export type ExtensionsResponse = {
  message: string;
  rental: Extension;
};

export type Extension = {
  id: number;
  documentId: string;
  currentExpirationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: any;
  notifiedExpiration1h: boolean;
  notifiedExpiration30m: boolean;
  notifiedExpiration5m: boolean;
};
export function useAccountActions({
  account,
  isAccountRented,
  accountRentalId,
}: {
  account?: AccountType;
  isAccountRented?: boolean;
  accountRentalId?: string;
}) {
  const queryClient = useQueryClient();
  const { isNexusAccount } = useAccountStore();
  const [selectedRentalOptionDocumentId, setSelectedRentalOptionDocumentId] = useState<string>('');
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [selectedExtensionIndex, setSelectedExtensionIndex] = useState<number>(1);
  const router = useRouter();

  const invalidateRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accounts'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['rentals'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['users', 'me'], exact: false }),
    ]);
  };
  const {
    data: dropRefund,
  } = useQuery({
    queryKey: ['rentals', 'refund', accountRentalId],
    queryFn: async () => {
      return await strapiClient.request<RefundResponse>('get', `rentals/${accountRentalId}/refund`);
    },
    enabled: !!(isAccountRented && accountRentalId),
  });

  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<
    { message: string },
    RawStrapiError,
    { silently?: boolean }
  >({
    mutationKey: ['rentals', 'drop', accountRentalId],
    mutationFn: async (_variables) => {
      setIsDropDialogOpen(false);
      return await strapiClient.request<{
        message: string;
      }>('delete', `rentals/${accountRentalId}`);
    },
    onSuccess: async (data, variables) => {
      await invalidateRelatedQueries();
      AccountMonitor.IsNexusAccount().then((isNexus) => {
        if (isNexus || isNexusAccount) {
          Manager.ForceCloseAllClients().catch((error) => {
            console.error('Failed to force close all clients:', error);
          });
        }
      });
      if (variables.silently) {
        return;
      }
      toast.success(data.message || 'Account dropped successfully');
    },
    onError: (data) => {
      toast.error(data.error.message || 'Failed to drop account');
    },
  });
  const { mutate: handleExtendAccount, isPending: isExtendPending } = useMutation({
    mutationKey: ['accounts', 'extend', account?.documentId],
    mutationFn: async (timeOptionDocumentId: string) => {
      const requestPromise = strapiClient.request<ExtensionsResponse>('post', `rentals/${accountRentalId}/extensions`, {
        data: {
          gameDocumentId: account?.rankings[0].game.documentId,
          timeOptionDocumentId,
        },
      });
      const isOverlayPage = router.state.location.pathname === '/overlay';

      // Criar um ID de loading para gerenciar manualmente o toast
      const toastId = isOverlayPage ? null : toast.loading('Extending account...');

      try {
        const response = await requestPromise;

        // Executar o timeout e invalidação
        await new Promise((resolve) => {
          setTimeout(async () => {
            await invalidateRelatedQueries();
            resolve(null);
          }, 1200);
        });

        // Após timeout e invalidação, atualizar o toast
        if (!isOverlayPage) {
          toast.success(response.message || 'Account time extended successfully', {
            id: toastId as any,
          });
        }

        return response;
      } catch (error) {
        if ('message' in error) {
          toast.error(error.error?.message, { id: toastId as any });
        } else {
          toast.error(error.error?.message, { id: toastId as any });
        }
        throw error;
      }
    },
  });
  type RentAccountVariables = {
    timeOptionDocumentId: string;
    boostRoyalOrderId?: number;
  };
  // In useAccountActions.ts, update the handleRentAccount mutation:
  const { mutate: handleRentAccount, isPending: isRentPending } = useMutation<
    { message: string },
    RawStrapiError,
    RentAccountVariables,
    unknown
  >({
    mutationKey: ['accounts', 'rent', account?.documentId],
    mutationFn: async ({ boostRoyalOrderId, timeOptionDocumentId }: { timeOptionDocumentId: string; boostRoyalOrderId?: number }) => {
      const response = await strapiClient.create<{
        message: string;
      }>(`accounts/${account?.documentId}/rentals`, {
        gameDocumentId: account?.rankings[0].game.documentId,
        timeOptionDocumentId,
        boostRoyalOrderId,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      await invalidateRelatedQueries();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.error.message);
    },
  });
  return {
    setSelectedExtensionIndex,
    selectedRentalOptionDocumentId,
    setSelectedRentalOptionDocumentId,
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
  };
}
