import type { Root } from '@/routes/_protected/accounts';
import type { AccountType } from '@/types/types';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
// hooks/useAccounts.ts
import { useMemo, useState } from 'react';

export function useAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  const [sortConfig, setSortConfig] = useState<{
    key: keyof AccountType | null;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: null,
    direction: null,
  });

  const router = useRouter();
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await strapiClient.find<AccountType[]>('accounts/available');
      return res.data;
    },
  });

  const { data: price, isLoading: isPriceLoading } = useQuery({
    queryKey: ['price'],
    queryFn: async () => {
      const res = await strapiClient.request<Root>('get', 'price');
      return res.data;
    },
  });

  const { getRankColor, getEloIcon, getRegionIcon, getGameIcon } = useMapping();

  const requestSort = (key: keyof AccountType) => {
    let direction: 'ascending' | 'descending' | null = 'ascending';

    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        direction = null;
      }
    }

    setSortConfig({ key, direction });
  };

  const sortedAccounts = useMemo(() => {
    if (!accounts) {
      return [];
    }

    const sortableAccounts = [...accounts];

    if (sortConfig.key && sortConfig.direction) {
      sortableAccounts.sort((a, b) => {
        if (a[sortConfig.key!]! < b[sortConfig.key!]!) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key!]! > b[sortConfig.key!]!) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableAccounts;
  }, [accounts, sortConfig]);

  const filteredAccounts = useMemo(() => {
    return sortedAccounts.filter((account) => {
      if (searchQuery && !account.id.toString().includes(searchQuery.toLowerCase())) {
        return false;
      }

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

      if (filters.rank && account.rankings.some(ranking => ranking.elo !== filters.rank)) {
        return false;
      }

      if (filters.region && account.server !== filters.region) {
        return false;
      }

      if (
        account.bannedGames.includes('league')
        && (account.LCUchampions < filters.minChampions || account.LCUchampions > filters.maxChampions)
      ) {
        return false;
      }

      if (account.LCUskins < filters.minSkins || account.LCUskins > filters.maxSkins) {
        return false;
      }

      if (filters.company && account.type !== filters.company) {
        return false;
      }

      return !(filters.status && account.type !== filters.status);
    });
  }, [sortedAccounts, searchQuery, filters]);

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
      selectedSkins: [],
    });
    setSearchQuery('');
    setSortConfig({ key: null, direction: null });
  };

  const SortIndicator = ({ column }: { column: keyof AccountType | 'coin_price' }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }

    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const handleViewAccountDetails = (accountId: string) => {
    router.navigate({ to: `/accounts/${accountId}` });
  };

  return {
    // State
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    sortConfig,

    // Data
    accounts,
    isLoading,
    price,
    isPriceLoading,

    // Mapping utilities
    getRankColor,
    getEloIcon,
    getRegionIcon,
    getGameIcon,

    // Derived data
    sortedAccounts,
    filteredAccounts,

    requestSort,
    resetFilters,
    SortIndicator,
    handleViewAccountDetails,
  };
}
