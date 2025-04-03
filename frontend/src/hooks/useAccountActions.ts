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
  onAccountChange: () => void;
}) {
  const { refetchUser } = useCommonFetch();
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);

  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<{ message: string }, StrapiError>({
    mutationKey: ['accounts', 'drop', account.documentId],
    mutationFn: async () => {
      return await strapiClient.request<{ message: string }>('post', `accounts/${account.documentId}/drop`);
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchUser();
      onAccountChange();
    },
    onError: (error) => {
      toast.error(error.error.message);
      onAccountChange();
    },
  });

  const { mutate: handleRentAccount, isPending: isRentPending } = useMutation<
    { message: string },
    StrapiError,
    number
  >({
    mutationKey: ['accounts', 'rent', account.documentId],
    mutationFn: async (timeIndex: number) => {
      return await strapiClient.request<{ message: string }>('post', `accounts/${account.documentId}/rentals`, {
        data: {
          game: 'league',
          time: timeIndex,
        },
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchUser();
      onAccountChange();
    },
    onError: (error) => {
      toast.error(error.error.message);
      onAccountChange();
    },
  });

  return {

    selectedRentalOptionIndex,
    setSelectedRentalOptionIndex,
    handleRentAccount,
    isRentPending,

    isDropDialogOpen,
    setIsDropDialogOpen,
    handleDropAccount,
    isDropPending,
  };
}
