import type { AccountType, UserType } from '@/types/types';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
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
  onAccountChange: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const { isNexusAccount } = useAccountStore();
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [selectedExtensionIndex, setSelectedExtensionIndex] = useState<number>(1);
  const router = useRouter();

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
      toast.error(error.error.message);
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

      if (router.state.location.pathname === '/overlay') {
        return requestPromise;
      }

      // Criar um ID de loading para gerenciar manualmente o toast
      const toastId = toast.loading('Extending account...');

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
        toast.success(response.message || 'Account time extended successfully', {
          id: toastId,
        });

        return response;
      } catch (error) {
        toast.error(error.error?.message, { id: toastId });
        throw error;
      }
    },
  });
  // In useAccountActions.ts, update the handleRentAccount mutation:
  const { mutate: handleRentAccount, isPending: isRentPending } = useMutation<
    { message: string },
    StrapiError,
    number,
    unknown
  >({
    mutationKey: ['accounts', 'rent', account?.documentId],
    mutationFn: async (timeIndex, boostRoyalOrderId?: number) => {
      return strapiClient.request<{
        message: string;
      }>('post', `accounts/${account?.documentId}/rentals`, {
        data: {
          game: 'league',
          time: timeIndex,
          boostRoyalOrderId,
        },
      });
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
