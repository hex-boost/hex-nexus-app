import type { AccountType } from '@/types/types';
import { strapiClient } from '@/lib/strapi';
import { useQuery } from '@tanstack/react-query';
// hooks/use-accounts.ts
import { useMemo, useState } from 'react';

export function useAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    game: '',
    division: '',
    rank: '',
    region: '',
    minChampions: 0,
    maxChampions: 200,
    minSkins: 0,
    maxSkins: 150,
    company: '',
    status: '',
    selectedChampions: [] as string[],
    selectedSkins: [] as string[],
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await strapiClient.find<AccountType[]>('accounts/available');
      return res.data;
    },
  });

  const filteredAccounts = useMemo(() => {
    if (!accounts) {
      return [];
    }

    return accounts.filter((account) => {
      if (searchQuery && !account.id.toString().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by game
      if (
        filters.game
        && ((filters.game === 'League of Legends' && account.bannedGames.includes('league'))
          || (filters.game === 'Valorant' && account.bannedGames.includes('valorant')))
      ) {
        return false;
      }

      if (filters.division && !account.rankings.some(ranking => ranking.division === filters.division)) {
        return false;
      }

      // Filter by rank
      if (filters.rank && account.rankings.some(ranking => ranking.elo !== filters.rank)) {
        return false;
      }

      // Filter by region
      if (filters.region && account.server !== filters.region) {
        return false;
      }

      // Filter by champions count
      if (
        account.bannedGames.includes('league')
        && (account.LCUchampions < filters.minChampions || account.LCUchampions > filters.maxChampions)
      ) {
        return false;
      }

      // Filter by skins count
      if (account.LCUskins < filters.minSkins || account.LCUskins > filters.maxSkins) {
        return false;
      }

      // Filter by company
      if (filters.company && account.type !== filters.company) {
        return false;
      }

      // Filter by status
      if (filters.status && account.type !== filters.status) {
        return false;
      }

      return true;
    });
  }, [accounts, searchQuery, filters]);

  // Fix the resetFilters function to include selectedSkins
  const resetFilters = () => {
    setFilters({
      game: '',
      division: '',
      rank: '',
      region: '',
      minChampions: 0,
      maxChampions: 200,
      minSkins: 0,
      maxSkins: 150,
      company: '',
      status: '',
      selectedChampions: [],
      selectedSkins: [], // Add the missing property
    });
  };

  // Add any additional filtering functions you might need
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleChampion = (championId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedChampions: prev.selectedChampions.includes(championId)
        ? prev.selectedChampions.filter(id => id !== championId)
        : [...prev.selectedChampions, championId],
    }));
  };

  const toggleSkin = (skinId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSkins: prev.selectedSkins.includes(skinId)
        ? prev.selectedSkins.filter(id => id !== skinId)
        : [...prev.selectedSkins, skinId],
    }));
  };

  // Return all values needed by components
  return {
    accounts,
    filteredAccounts,
    isLoading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    toggleChampion,
    toggleSkin,
  };
}
