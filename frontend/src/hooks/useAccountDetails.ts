import type { Price } from '@/types/price.ts';
import type { AccountType } from '@/types/types.ts';

import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { strapiClient } from '@/lib/strapi.ts';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {} from 'wailsjs/go/riot/Client.js';

export function useAccountDetails({
  account,
  onAccountChange,
}: {
  onAccountChange: () => void;
  account: AccountType;
  price: Price;
}) {
  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);

  const [championsSearch, setChampionsSearch] = useState('');
  const [skinsSearch, setSkinsSearch] = useState('');

  // Filtered data with memoization for performance
  const filteredChampions = useMemo(() =>
    account.LCUchampions.filter(champion =>
      champion,
      // champion.name.toLowerCase().includes(championsSearch.toLowerCase()),
    ), [account.LCUchampions, championsSearch]);

  const filteredSkins = useMemo(() =>
    account.LCUskins.filter(skin =>
      skin,
      // skin.name.toLowerCase().includes(skinsSearch.toLowerCase())
      // || skin.champion.toLowerCase().includes(skinsSearch.toLowerCase()),
    ), [account.LCUskins, skinsSearch]);

  const getSoloQueueRank = () => {
    const soloRank = account.rankings?.find(r => r.queueType === 'soloqueue');
    return { elo: soloRank?.elo, points: soloRank?.points, division: soloRank?.division };
  };

  const getFlexQueueRank = () => {
    const flexRank = account.rankings?.find(r => r.queueType === 'flex');
    return { elo: flexRank?.elo, points: flexRank?.points, division: flexRank?.division };
  };
  const handleLoginToAccount = useCallback(() => {
  }, [account.id]);
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
      onAccountChange();
    },
    onError: (error) => {
      toast.error(error.error.message);
      onAccountChange();
    },
  });

  const handleDropAccount = useCallback(() => {
    // setIsDropDialogOpen(false);
    // Additional implementation to be added
  }, []);

  return {
    // State
    handleRentAccount,
    isRentPending,
    setSelectedRentalOptionIndex,
    selectedRentalOptionIndex,
    isDropDialogOpen,
    setIsDropDialogOpen,
    championsSearch,
    setChampionsSearch,
    skinsSearch,
    setSkinsSearch,

    // Derived data
    filteredChampions,
    filteredSkins,
    getFlexQueueRank,
    getSoloQueueRank,
    handleLoginToAccount,
    handleDropAccount,
  };
}
