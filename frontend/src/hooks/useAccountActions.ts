import type { AccountType } from '@/types/types';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { useCommonFetch } from '@/hooks/useCommonFetch.ts';
import { strapiClient } from '@/lib/strapi';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export function useAccountActions({
  account,
  onAccountChange,
}: {
  account: AccountType;
  onAccountChange: () => Promise<void>;
}) {
  const { refetchUser } = useCommonFetch();
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [selectedExtensionIndex, setSelectedExtensionIndex] = useState<number>(1);

  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<{ message: string }, StrapiError>({
    mutationKey: ['accounts', 'drop', account.documentId],
    mutationFn: async () => {
      const response = await strapiClient.request<{ message: string }>('post', `accounts/${account.documentId}/drop`);
      await refetchUser();
      await onAccountChange();
      return response;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.error.message);
    },

  });

  const { mutate: handleExtendAccount, isPending: isExtendPending } = useMutation<
    { message: string },
    StrapiError,
    number
  >({
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
          error: error => error.error?.message || 'Failed to extend account',
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
  };
}
