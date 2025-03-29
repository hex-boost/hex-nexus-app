import type { AccountType } from '@/types/types';
import { useAllDataDragon } from '@/hooks/useDataDragon';
import { useMemo, useState } from 'react';

export function useAccountFilters({
  account,
}: {
  account: AccountType;
}) {
  const [championsSearch, setChampionsSearch] = useState('');
  const [skinsSearch, setSkinsSearch] = useState('');

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
        return allChampions.find(c => c.id === championId.toString());
      })
      .filter(champion =>
        champion && champion.name.toLowerCase().includes(championsSearch.toLowerCase()),
      );
  }, [account.LCUchampions, championsSearch, allChampions, isLoading, rawChampionsData]);

  return {
    championsSearch,
    setChampionsSearch,
    skinsSearch,
    setSkinsSearch,
    filteredChampions,
    filteredSkins,
    isLoading,
  };
}
