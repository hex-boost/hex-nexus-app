import type { AccountType, StrapiError, UserType } from '@/types/types';
import { strapiClient } from '@/lib/strapi';
import { useAccountStore } from '@/stores/useAccountStore.ts';
import { Manager } from '@leagueManager';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export function useAccountActions({
  account,
  user,
}: {
  account?: AccountType;
  user: UserType | null;
}) {
  const queryClient = useQueryClient();
  const { isNexusAccount } = useAccountStore();
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [selectedExtensionIndex, setSelectedExtensionIndex] = useState<number>(1);
  const router = useRouter();

  const invalidateRelatedQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['accounts', 'rented'] });
    await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
  };
  const {
    data: dropRefund,
  } = useQuery({
    queryKey: ['accounts', 'refund', account?.id],
    queryFn: async () => {
      return (await strapiClient.request<{
        data: { amount: number };
      }>('get', `accounts/${account?.documentId}/refund`, {
        validateStatus: status => status <= 500,
      })).data;
    },
    enabled: account?.user?.documentId === user?.documentId,
  });

  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<{ message: string }, StrapiError>({
    mutationKey: ['accounts', 'drop', account?.documentId],
    mutationFn: async () => {
      setIsDropDialogOpen(false);

      return await strapiClient.request<{
        message: string;
      }>('post', `accounts/${account?.documentId}/drop`);
    },
    onSuccess: (data) => {
      invalidateRelatedQueries();
      Manager.ForceCloseAllClients();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.data.error.message);
    },
  });

  const { mutate: handleExtendAccount, isPending: isExtendPending } = useMutation({
    mutationKey: ['accounts', 'extend', account?.documentId],
    mutationFn: async (timeIndex: number) => {
      setSelectedExtensionIndex(timeIndex);

      const requestPromise = strapiClient.request<{
        message: string;
      }>('put', `accounts/${account?.documentId}/extend`, {
        data: {
          game: 'league',
          time: timeIndex,
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
          }, 1500);
        });

        // Após timeout e invalidação, atualizar o toast
        if (!isOverlayPage) {
          toast.success(response.message || 'Account time extended successfully', {
            id: toastId as any,
          });
        }

        return response;
      } catch (error) {
        toast.error(error.error?.message, { id: toastId as any });
        throw error;
      }
    },
  });
  type RentAccountVariables = {
    timeIndex: number;
    boostRoyalOrderId?: number;
  };
  // In useAccountActions.ts, update the handleRentAccount mutation:
  const { mutate: handleRentAccount, isPending: isRentPending } = useMutation<
    { message: string },
    StrapiError,
    RentAccountVariables,
    unknown
  >({
    mutationKey: ['accounts', 'rent', account?.documentId],
    mutationFn: async ({ boostRoyalOrderId, timeIndex }: { timeIndex: number; boostRoyalOrderId?: number }) => {
      return (await strapiClient.create<{
        message: string;
      }>(`accounts/${account?.documentId}/rentals`, {
        game: 'league',
        time: timeIndex,
        boostRoyalOrderId,
      })).data;
    },
    onSuccess: async (data) => {
      await invalidateRelatedQueries();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.data.error.message);
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
  };
}
