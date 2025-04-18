import type { AccountType, UserType } from '@/types/types';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { useGoState } from '@/hooks/useGoBindings.ts';
import { strapiClient } from '@/lib/strapi';
import { useAccountStore } from '@/stores/useAccountStore.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
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
  const { Utils } = useGoState();
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

      const requestPromise = strapiClient.request<{
        message: string;
      }>('put', `accounts/${account?.documentId}/extend`, {
        data: {
          game: 'league',
          timeEnum: timeIndex,
        },
      });

      if (router.state.location.pathname === '/overlay') {
        return requestPromise;
      }
      return toast.promise(requestPromise, {
        loading: 'Extending account...',
        success: data => data.message || 'Account extended successfully',
        error: error => error.error?.message || 'This feature is not implemented yet',
        duration: 3000,
      });
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
    mutationFn: async (timeIndex) => {
      setIsDropDialogOpen(false);

      return strapiClient.request<{
        message: string;
      }>('post', `accounts/${account?.documentId}/rentals`, {
        data: {
          game: 'league',
          time: timeIndex,
        },
      });
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
  };
}
