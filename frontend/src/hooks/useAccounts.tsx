import type { AccountType, RankingType } from '@/types/types';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

export function getLeaverBusterInfo(account: AccountType) {
  if (!account.leaverBuster?.leaverBusterEntryDto) {
    return null;
  }

  const leaverData = account.leaverBuster.leaverBusterEntryDto;
  const penaltyData = leaverData.leaverPenalty;

  const hasActivePenalties
        = penaltyData?.hasActivePenalty === true
          || leaverData.punishedGamesRemaining > 0
          || (penaltyData?.rankRestricted === true && penaltyData?.rankRestrictedGamesRemaining > 0);

  if (hasActivePenalties) {
    const waitTimeMinutes = penaltyData?.delayTime ? Math.floor(penaltyData.delayTime / 60000) : 0;

    let message = '';

    // Low Priority Queue (most important info for boosters)
    if (leaverData.punishedGamesRemaining > 0) {
      message += `${waitTimeMinutes}min queue × ${leaverData.punishedGamesRemaining} games`;
    }

    // Ranked restrictions (also important)
    if (penaltyData?.rankRestricted && penaltyData?.rankRestrictedGamesRemaining > 0) {
      if (message) {
        message += ' • ';
      }
      message += `Ranked restricted: ${penaltyData.rankRestrictedGamesRemaining} games`;
    }

    return {
      hasRestriction: true,
      severity: leaverData.leaverLevel,
      message,
    };
  }

  return null; // No active penalties
}

type SortKey = keyof AccountType | 'coin_price' | 'winrate';

export function useAccounts() {
  const queryClient = useQueryClient();

  const persistedState: any = queryClient.getQueryData(['accounts-filter-state']) || {
    searchQuery: '',
    showFilters: false,
    selectedChampionIds: [], // Ensure this is always an array
    selectedSkinIds: [], // Ensure this is always an array
    filters: {
      leaverStatus: [],
      game: '',
      division: '',
      rank: '',
      region: '',
      company: '',
      status: '',
      selectedChampions: [], // Ensure this is always an array
      minBlueEssence: 0,
      selectedSkins: [], // Ensure this is always an array
    },
    sortConfig: {
      key: null,
      direction: null,
    },
  };

  // Initialize state with persisted values and ensure arrays
  const [searchQuery, setSearchQuery] = useState(persistedState.searchQuery || '');
  const [showFilters, setShowFilters] = useState(persistedState.showFilters || false);
  const [selectedChampionIds, setSelectedChampionIds] = useState(Array.isArray(persistedState.selectedChampionIds) ? persistedState.selectedChampionIds : []);
  const [selectedSkinIds, setSelectedSkinIds] = useState(Array.isArray(persistedState.selectedSkinIds) ? persistedState.selectedSkinIds : []);
  const [filters, setFilters] = useState({
    ...persistedState.filters,
    selectedChampions: Array.isArray(persistedState.filters?.selectedChampions) ? persistedState.filters.selectedChampions : [],
    selectedSkins: Array.isArray(persistedState.filters?.selectedSkins) ? persistedState.filters.selectedSkins : [],
    leaverStatus: Array.isArray(persistedState.filters?.leaverStatus) ? persistedState.filters.leaverStatus : [],
  });
  const [sortConfig, setSortConfig] = useState(persistedState.sortConfig || { key: null, direction: null });

  const { getRankColor, getEloIcon, getRegionIcon, getGameIcon } = useMapping();
  // Update persisted state when filters change
  const updatePersistedState = useCallback(() => {
    queryClient.setQueryData(['accounts-filter-state'], {
      searchQuery,
      showFilters,
      selectedChampionIds,
      selectedSkinIds,
      filters,
      sortConfig,
    });
  }, [queryClient, searchQuery, showFilters, selectedChampionIds, selectedSkinIds, filters, sortConfig]);

  // Custom setters that update both local state and persisted state
  const setSearchQueryPersisted = useCallback((value: string) => {
    setSearchQuery(value);
    queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, searchQuery: value }));
  }, [queryClient]);

  const setShowFiltersPersisted = useCallback((value: boolean) => {
    setShowFilters(value);
    queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, showFilters: value }));
  }, [queryClient]);

  const setFiltersPersisted = useCallback((value: typeof filters) => {
    setFilters(value);
    queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, filters: value }));
  }, [queryClient]);

  const setSelectedChampionIdsPersisted = useCallback((value: string[]) => {
    const safeValue = Array.isArray(value) ? value : [];
    setSelectedChampionIds(safeValue);
    queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, selectedChampionIds: safeValue }));
  }, [queryClient]);

  const setSelectedSkinIdsPersisted = useCallback((value: string[]) => {
    const safeValue = Array.isArray(value) ? value : [];
    setSelectedSkinIds(safeValue);
    queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, selectedSkinIds: safeValue }));
  }, [queryClient]);

  // Update persisted sort config
  const requestSort = useCallback((key: SortKey) => {
    let direction: 'ascending' | 'descending' | null = 'ascending';

    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        const newConfig = { key: null, direction: null };
        setSortConfig(newConfig);
        queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, sortConfig: newConfig }));
        return;
      }
    }

    const newConfig = { key, direction };
    setSortConfig(newConfig);
    queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, sortConfig: newConfig }));
  }, [sortConfig, queryClient]);

  const resetFilters = useCallback(() => {
    const initialState = {
      searchQuery: '',
      showFilters: false,
      selectedChampionIds: [],
      selectedSkinIds: [],
      filters: {
        minBlueEssence: 0,
        game: '',
        division: '',
        rank: '',
        region: '',
        company: '',
        status: '',
        selectedChampions: [],
        selectedSkins: [],
        leaverStatus: [],
      },
      sortConfig: {
        key: null,
        direction: null,
      },
    };

    setSearchQuery(initialState.searchQuery);
    setSelectedChampionIds(initialState.selectedChampionIds);
    setSelectedSkinIds(initialState.selectedSkinIds);
    setFilters(initialState.filters);
    setSortConfig(initialState.sortConfig);

    // Reset persisted state
    queryClient.setQueryData(['accounts-filter-state'], initialState);
  }, [queryClient]);
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

  const sortedAccounts = useMemo(() => {
    if (!accounts) {
      return [];
    }

    const sortableAccounts = [...accounts];

    // Add null/undefined check before accessing properties
    if (sortConfig?.key && sortConfig?.direction) {
      sortableAccounts.sort((a, b) => {
        if (sortConfig.key === 'LCUchampions' || sortConfig.key === 'LCUskins') {
          const aArray = a[sortConfig.key as keyof AccountType] as unknown as any[] || [];
          const bArray = b[sortConfig.key as keyof AccountType] as unknown as any[] || [];

          const aLength = aArray?.length || 0;
          const bLength = bArray?.length || 0;

          return sortConfig.direction === 'ascending'
            ? aLength - bLength
            : bLength - aLength;
        }

        if (sortConfig.key === 'coin_price') {
          const aRank = a.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current')?.elo?.toLowerCase() || 'unranked';
          const bRank = b.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current')?.elo?.toLowerCase() || 'unranked';

          const rankValues: Record<string, number> = {
            challenger: 9,
            grandmaster: 8,
            master: 7,
            diamond: 6,
            platinum: 5,
            gold: 4,
            silver: 3,
            bronze: 2,
            iron: 1,
            unranked: 0,
          };

          const aValue = rankValues[aRank] || 0;
          const bValue = rankValues[bRank] || 0;

          return sortConfig.direction === 'ascending'
            ? aValue - bValue
            : bValue - aValue;
        }

        if (sortConfig.key === 'winrate') {
          const aRanking = a.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current');
          const bRanking = b.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current');

          const aTotalGames = (aRanking?.wins || 0) + (aRanking?.losses || 0);
          const bTotalGames = (bRanking?.wins || 0) + (bRanking?.losses || 0);

          const aWinRate = aTotalGames > 0 ? (aRanking?.wins || 0) / aTotalGames : 0;
          const bWinRate = bTotalGames > 0 ? (bRanking?.wins || 0) / bTotalGames : 0;

          return sortConfig.direction === 'ascending'
            ? aWinRate - bWinRate
            : bWinRate - aWinRate;
        }

        const aValue = a[sortConfig.key as keyof AccountType];
        const bValue = b[sortConfig.key as keyof AccountType];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableAccounts;
  }, [accounts, sortConfig]);

  const filteredAccounts = useMemo(() => {
    return sortedAccounts.filter((account) => {
      const soloqueueRanking = account.rankings.find(
        ranking => ranking.queueType === 'soloqueue' && ranking.type === 'current' && ranking.elo !== '',
      ) || account.rankings.find(
        ranking => ranking.queueType === 'soloqueue' && ranking.type === 'provisory',
      ) || {
        elo: '',
        division: '',
        points: 0,
        wins: 0,
        losses: 0,
      } as RankingType;
      const blueEssence = account.blueEssence || 0;
      if (blueEssence < filters.minBlueEssence) {
        return false;
      }

      if (searchQuery && !account.documentId.toString().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filters.division && filters.division !== 'any'
        && (!soloqueueRanking || soloqueueRanking.division !== filters.division)) {
        return false;
      }

      if (filters.rank && filters.rank !== 'any'
        && (!soloqueueRanking || soloqueueRanking.elo?.toLowerCase() !== filters.rank.toLowerCase())) {
        return false;
      }
      if (filters.selectedChampions.length > 0) {
        const missingChampions = filters.selectedChampions.some(championId =>
          !account.LCUchampions.includes(Number.parseInt(championId)),
        );
        if (missingChampions) {
          return false;
        }
      }

      if (filters.selectedSkins.length > 0) {
        const missingSkins = filters.selectedSkins.some(skinId =>
          !account.LCUskins.includes(Number.parseInt(skinId)),
        );
        if (missingSkins) {
          return false;
        }
      }
      if (filters.region && filters.region !== 'any' && account.server !== filters.region) {
        return false;
      }

      if (filters.company && filters.company !== 'any' && account.type !== filters.company) {
        return false;
      }
      if (filters.leaverStatus && filters.leaverStatus.length > 0) {
        const leaverInfo = getLeaverBusterInfo(account);

        if (!leaverInfo && filters.leaverStatus.includes('none')) {
          return true;
        }
        if (!leaverInfo) {
          return false;
        }

        if (leaverInfo.severity >= 3 && filters.leaverStatus.includes('high')) {
          return true;
        }
        if (leaverInfo.severity >= 1 && leaverInfo.severity < 3 && filters.leaverStatus.includes('medium')) {
          return true;
        }
        if (leaverInfo.severity === 0 && filters.leaverStatus.includes('low')) {
          return true;
        }
        return false;
      }
      return true;
    });
  }, [sortedAccounts, searchQuery, filters]);

  const SortIndicator = ({ column }: { column: SortKey }) => {
    // Add null check here too
    if (!sortConfig || sortConfig.key !== column || sortConfig.direction === null) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }

    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const handleViewAccountDetails = (accountId: string) => {
    router.navigate({ to: `/accounts/${accountId}` });
  };
  const availableRegions = useMemo(() => {
    if (!accounts) {
      return [];
    }

    // Create a Set of unique server values and convert back to array
    const regions = [...new Set(accounts.map(account => account.server))];

    // Sort alphabetically for consistent display
    return regions.sort();
  }, [accounts]);
  return {
    availableRegions,
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    sortConfig,
    accounts,
    isLoading,
    getRankColor,
    getEloIcon,
    getRegionIcon,
    getGameIcon,
    sortedAccounts,
    filteredAccounts,
    requestSort,
    setSearchQueryPersisted,
    setSelectedChampionIdsPersisted,
    setSelectedSkinIdsPersisted,
    resetFilters,
    SortIndicator,
    handleViewAccountDetails,
    selectedChampionIds,
    setFiltersPersisted,
    setSelectedChampionIds,
    setSelectedSkinIds,
    setShowFiltersPersisted,
    selectedSkinIds,
    updatePersistedState,

  };
}
