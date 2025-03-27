import type { Price } from '@/types/price.ts';
import type { AccountType } from '@/types/types.ts';

import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { useAllDataDragon } from '@/hooks/useDataDragon.ts';
import { strapiClient } from '@/lib/strapi.ts';

import { useUserStore } from '@/stores/useUserStore.ts';

import { AuthenticateWithCaptcha } from '@riot';

import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { InitializeConnection, WaitInventoryIsReady, WaitUntilReady } from '../../wailsjs/go/league/LCUConnection.js';
import { UpdateSummonerFromLCU } from '../../wailsjs/go/league/Service.js';

export function useAccountDetails({
  account,
  onAccountChange,

}: {
  onAccountChange: () => void;
  account: AccountType;
  price: Price;
}) {
  const [championsSearch, setChampionsSearch] = useState('');
  const [skinsSearch, setSkinsSearch] = useState('');
  const { mutate: handleDropAccount, isPending: isDropPending } = useMutation<{ message: string }, StrapiError>({
    mutationKey: ['accounts', 'drop', account.documentId],
    mutationFn: async () => {
      return await strapiClient.request<{ message: string }>('post', `accounts/${account.documentId}/drop`);
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

  const [selectedRentalOptionIndex, setSelectedRentalOptionIndex] = useState<number>(1);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);

  const { jwt } = useUserStore();
  const {
    allChampions,
    rawChampionsData,
    isLoading,
    allSkins,

  } = useAllDataDragon();

  const filteredSkins = useMemo(() => {
    if (isLoading || !allSkins.length || !account.LCUskins.length) {
      return [];
    }

    // Filter skins from all skins based on account's skin IDs
    const accountSkins = allSkins.filter(skin =>
      account.LCUskins.includes(skin.id),
    );

    // Apply search filter
    return accountSkins.filter(skin =>
      skin && (
        skin.name.toLowerCase().includes(skinsSearch.toLowerCase())
        || skin.champion.toLowerCase().includes(skinsSearch.toLowerCase())
      ),
    );
  }, [account.LCUskins, skinsSearch, allSkins, isLoading]);
  const filteredChampions = useMemo(() => {
    if (isLoading || !rawChampionsData || !allChampions.length) {
      return [];
    }

    return account.LCUchampions
      .map((championId) => {
        // Find champion by ID from all champions
        return allChampions.find(c => c.id === championId.toString());
      })
      .filter(champion =>
        champion && champion.name.toLowerCase().includes(championsSearch.toLowerCase()),
      );
  }, [account.LCUchampions, championsSearch, allChampions, isLoading, rawChampionsData]);
  if (!account) {
    return;
  }

  // Filtered data with memoization for performance

  const { mutate: handleSummonerUpdate } = useMutation<any, string>({
    mutationKey: ['summoner', 'update', account.id],
    mutationFn: async () => {
      await WaitUntilReady();
      await InitializeConnection();
      await WaitInventoryIsReady();
      await UpdateSummonerFromLCU(account.username, account.password, jwt!);
    },
    onError: (error) => {
      console.error(error);
    },
    onSuccess: async () => {
      console.log('Summoner updated');
    },
  });

  const { mutate: handleLoginToAccount, isPending: _ } = useMutation<any, string>({
    mutationKey: ['account', 'login', account.id],
    mutationFn: async () => {
      await AuthenticateWithCaptcha(account.username, account.password);
    },
    onError: (error) => {
      toast.error('Error logging in to account');
      console.error('error logging', error);
    },
    onSuccess: async () => {
      toast.success('Successfully logged in to account');
      handleSummonerUpdate();
    },
  },
  );
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
    handleDropAccount,
    // Derived data
    filteredChampions,
    filteredSkins,
    isDropPending,
    handleLoginToAccount,
  };
}
