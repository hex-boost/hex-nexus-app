import type { AccountType } from '@/types/types';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'; // hooks/useAccounts.ts
import { useMemo, useState } from 'react';

export function useAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    game: '',
    division: '',
    rank: '',
    region: '',
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
      return res.data.filter((account) => {
        if (account.user) {
          return false;
        }
        if (account.ban === null) {
          return true;
        }

        if (!account.ban.restrictions || account.ban.restrictions.length === 0) {
          return true;
        }
        const restrictions = account.ban.restrictions;

        // Filter out accounts with invalid credentials or MFA required
        const hasInvalidCredentials = restrictions.some(r =>
          r.type === 'INVALID_CREDENTIALS' || r.type === 'MFA_REQUIRED',
        );
        if (hasInvalidCredentials) {
          return false;
        }

        const hasPermanentBan = restrictions.some(r =>
          r.type === 'PERMANENT_BAN'
          && (r.scope === 'riot' || r.scope === 'lol' || !r.scope),
        );
        return !hasPermanentBan;
      });
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
      const soloqueueRanking = account.rankings.find(ranking => ranking.queueType === 'soloqueue' && ranking.type === 'current');

      // For search query, keep the existing logic
      if (searchQuery && !account.documentId.toString().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Check division filter against soloqueue ranking only
      if (filters.division && filters.division !== 'any'
        && (!soloqueueRanking || soloqueueRanking.division !== filters.division)) {
        return false;
      }

      // Check rank filter against soloqueue ranking only
      if (filters.rank && filters.rank !== 'any'
        && (!soloqueueRanking || soloqueueRanking.elo?.toLowerCase() !== filters.rank.toLowerCase())) {
        return false;
      }

      // Keep the rest of the filters as they are
      if (filters.region && filters.region !== 'any' && account.server !== filters.region) {
        return false;
      }

      if (filters.company && filters.company !== 'any' && account.type !== filters.company) {
        return false;
      }

      return true;
    });
  }, [sortedAccounts, searchQuery, filters]);
  const resetFilters = () => {
    setFilters({
      game: '',
      division: '',
      rank: '',
      region: '',
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
