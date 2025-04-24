import type { AccountType, Server } from '@/types/types';

import type { StrapiResponse } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export const availableRegions: Server[] = [
  'NA1',
  'EUW1',
  'EUN1',
  'OC1',
  'BR1',
  'JP1',
  'LA1',
  'LA2',
  'RU',
  'TR1',
  'ME1',
  'SG2',
  'PH2',
  'VN2',
  'TH2',
];

type SortKey = keyof AccountType | 'coin_price' | 'price' | 'winrate' | 'blueEssence' | 'LCUchampions' | 'LCUskins';

type FilterState = {
  leaverStatus: string[];
  game: string;
  divisions: string[];
  ranks: string[];
  region: string;
  company: string;
  status: string;
  selectedChampions: string[];
  minBlueEssence: number;
  selectedSkins: string[];
};

type AccountsState = {
  searchQuery: string;
  showFilters: boolean;
  selectedChampionIds: string[];
  selectedSkinIds: string[];
  filters: FilterState;
  sortConfig: {
    key: SortKey | null;
    direction: 'ascending' | 'descending' | null;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
};

const DEFAULT_STATE: AccountsState = {
  searchQuery: '',
  showFilters: false,
  selectedChampionIds: [],
  selectedSkinIds: [],
  filters: {
    leaverStatus: [],
    game: '',
    divisions: [],
    ranks: [],
    region: '',
    company: '',
    status: '',
    selectedChampions: [],
    minBlueEssence: 0,
    selectedSkins: [],
  },
  sortConfig: {
    key: null,
    direction: null,
  },
  pagination: {
    page: 1,
    pageSize: 20,
  },
};

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

export function useAccounts(initialPage = 1, initialPageSize = 20) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { getRankColor, getEloIcon, getRegionIcon, getGameIcon } = useMapping();

  // Get persisted state or use defaults
  const persistedState = (() => {
    const state = queryClient.getQueryData(['accounts-filter-state']);
    if (!state) {
      return {
        ...DEFAULT_STATE,
        pagination: { page: initialPage, pageSize: initialPageSize },
      };
    }

    return {
      ...state as AccountsState,
      selectedChampionIds: Array.isArray((state as any).selectedChampionIds) ? (state as any).selectedChampionIds : [],
      selectedSkinIds: Array.isArray((state as any).selectedSkinIds) ? (state as any).selectedSkinIds : [],
      filters: {
        ...(state as any).filters,
        selectedChampions: Array.isArray((state as any).filters?.selectedChampions) ? (state as any).filters.selectedChampions : [],
        selectedSkins: Array.isArray((state as any).filters?.selectedSkins) ? (state as any).filters.selectedSkins : [],
        leaverStatus: Array.isArray((state as any).filters?.leaverStatus) ? (state as any).filters.leaverStatus : [],
      },
    };
  })();

  const [state, setState] = useState<AccountsState>(persistedState);

  // Update persisted state when any part changes
  const updatePersistedState = useCallback(() => {
    queryClient.setQueryData(['accounts-filter-state'], state);
  }, [queryClient, state]);

  // Individual setters for state properties
  const setSearchQuery = useCallback((value: string) => {
    setState((prev) => {
      const newState = { ...prev, searchQuery: value };
      queryClient.setQueryData(['accounts-filter-state'], newState);
      return newState;
    });
  }, [queryClient]);

  const setShowFilters = useCallback((value: boolean) => {
    setState((prev) => {
      const newState = { ...prev, showFilters: value };
      queryClient.setQueryData(['accounts-filter-state'], newState);
      return newState;
    });
  }, [queryClient]);

  const setFilters = useCallback((value: FilterState) => {
    setState((prev) => {
      const newState = { ...prev, filters: value };
      queryClient.setQueryData(['accounts-filter-state'], newState);
      return newState;
    });
  }, [queryClient]);

  const setSelectedChampionIds = useCallback((value: string[]) => {
    setState((prev) => {
      const newState = { ...prev, selectedChampionIds: value };
      queryClient.setQueryData(['accounts-filter-state'], newState);
      return newState;
    });
  }, [queryClient]);

  const setSelectedSkinIds = useCallback((value: string[]) => {
    setState((prev) => {
      const newState = { ...prev, selectedSkinIds: value };
      queryClient.setQueryData(['accounts-filter-state'], newState);
      return newState;
    });
  }, [queryClient]);

  const setPagination = useCallback((value: AccountsState['pagination']) => {
    setState((prev) => {
      const newState = { ...prev, pagination: value };
      queryClient.setQueryData(['accounts-filter-state'], newState);
      return newState;
    });
  }, [queryClient]);
  // Reset all filters
  const resetFilters = useCallback(() => {
    const newState = {
      ...DEFAULT_STATE,
      pagination: {
        page: 1,
        pageSize: state.pagination.pageSize,
      },
    };
    setState(newState);
    queryClient.setQueryData(['accounts-filter-state'], newState);
  }, [queryClient, state.pagination.pageSize]);

  // Sort handling
  const requestSort = useCallback((key: SortKey) => {
    setState((prev) => {
      let direction: 'ascending' | 'descending' | null = 'ascending';

      if (prev.sortConfig.key === key) {
        if (prev.sortConfig.direction === 'ascending') {
          direction = 'descending';
        } else if (prev.sortConfig.direction === 'descending') {
          direction = null;
        }
      }

      const newConfig = direction === null
        ? { key: null, direction: null }
        : { key, direction };

      const newState = {
        ...prev,
        sortConfig: newConfig,
      };

      queryClient.setQueryData(['accounts-filter-state'], newState);
      return newState;
    });
  }, [queryClient]);

  // Build API query parameters
  const buildQueryParams = useCallback((page: number) => {
    const { filters, searchQuery, sortConfig } = state;
    const strapiFilters: any = {};

    // Document ID search
    if (searchQuery) {
      strapiFilters.documentId = { $containsi: searchQuery };
    }

    // Blue essence minimum
    if (filters.minBlueEssence > 0) {
      strapiFilters.blueEssence = { $gte: filters.minBlueEssence };
    }

    // Region filter
    if (filters.region && filters.region !== 'any') {
      strapiFilters.server = filters.region;
    }

    // Company/account type filter
    if (filters.company && filters.company !== 'any') {
      strapiFilters.type = filters.company;
    }

    if (filters.selectedChampions?.length > 0) {
      const championsFilter = {} as any;
      filters.selectedChampions.forEach((id, index) => {
        championsFilter.$contains = championsFilter.$contains || {};
        championsFilter.$contains[index] = Number.parseInt(id);
      });
      strapiFilters.LCUchampions = championsFilter;
    }

    // Skins filter
    if (filters.selectedSkins?.length > 0) {
      const skinsFilter = {} as any;
      filters.selectedSkins.forEach((id, index) => {
        skinsFilter.$contains = skinsFilter.$contains || {};
        skinsFilter.$contains[index] = Number.parseInt(id);
      });
      strapiFilters.LCUskins = skinsFilter;
    }

    // Restrictions filter
    if (filters.leaverStatus?.length > 0) {
      const restrictionFilter: any = {} as any;
      filters.leaverStatus.forEach((status, index) => {
        restrictionFilter.$contains = restrictionFilter.$contains || {};
        restrictionFilter.$contains[index] = status;
      });
      strapiFilters.restriction = restrictionFilter;
    }

    // Rank and division filters
    // Rank and division filters

    if (filters.ranks?.length > 0 && filters.divisions?.length > 0) {
      // Create an array of OR conditions for each rank+division combination
      const combinationFilters: any[] = [];

      for (const rank of filters.ranks) {
        for (const division of filters.divisions) {
          combinationFilters.push({
            $and: [
              { elo: { $eqi: rank } },
              { division: { $eqi: division } },
            ],
          });
        }
      }

      strapiFilters.rankings = {
        $and: [
          { queueType: { $eq: 'soloqueue' } },
          { type: { $eq: 'current' } },
          { $or: combinationFilters },
        ],
      };
    } else if (filters.ranks?.length > 0) {
      // Only ranks selected
      strapiFilters.rankings = {
        $and: [
          { queueType: { $eqi: 'soloqueue' } },
          { type: { $eqi: 'current' } },
          { elo: { $in: filters.ranks.map(rank => rank.toUpperCase()) } },
        ],
      };
    } else if (filters.divisions?.length > 0) {
      strapiFilters.rankings = {
        $and: [
          { queueType: { $eq: 'soloqueue' } },
          { type: { $eq: 'current' } },
          { division: { $in: filters.divisions } },
        ],
      };
    }

    const queryParams: any = {
      pagination: {
        page,
        pageSize: state.pagination.pageSize,
      },
    };

    if (Object.keys(strapiFilters).length > 0) {
      queryParams.filters = strapiFilters;
    }

    if (sortConfig.key && sortConfig.direction) {
      const sortDirection = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
      queryParams.sort = `${sortConfig.key}:${sortDirection}`;
    }

    return queryParams;
  }, [state]);

  // Main data query
  const { data, isLoading } = useQuery({
    queryKey: ['accounts', state.filters, state.searchQuery, state.pagination.page, state.pagination.pageSize, state.sortConfig],
    queryFn: async () => {
      const queryParams = buildQueryParams(state.pagination.page);
      return await strapiClient.find<AccountType[]>('accounts/available', queryParams) as StrapiResponse<AccountType[]>;
    },
  });

  // Prefetch next page
  useEffect(() => {
    if (data) {
      const nextPage = state.pagination.page + 1;
      if (nextPage <= Math.ceil(data.meta.pagination.total / state.pagination.pageSize)) {
        queryClient.prefetchQuery({
          queryKey: ['accounts', state.filters, state.searchQuery, nextPage, state.pagination.pageSize, state.sortConfig],
          queryFn: async () => {
            const queryParams = buildQueryParams(nextPage);
            return await strapiClient.find<AccountType[]>('accounts/available', queryParams);
          },
        });
      }
    }
  }, [data, state, queryClient, buildQueryParams]);

  // Navigation handler
  const handleViewAccountDetails = (accountId: string) => {
    router.navigate({ to: `/accounts/${accountId}` });
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (!state.sortConfig || state.sortConfig.key !== column || state.sortConfig.direction === null) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }

    return state.sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  // Page change handler
  const handlePageChange = useCallback((newPage: number) => {
    setPagination({ ...state.pagination, page: newPage });
  }, [state.pagination, setPagination]);
  const setPageSize = useCallback((newSize: number) => {
    setPagination({ page: 1, pageSize: newSize });
  }, [setPagination]);
  return {
    availableRegions,
    searchQuery: state.searchQuery,
    filteredAccounts: data?.data || [],
    showFilters: state.showFilters,
    setShowFilters,
    filters: state.filters,
    setFilters,
    data,
    isLoading,
    getRankColor,
    getEloIcon,
    getRegionIcon,
    getGameIcon,
    requestSort,
    resetFilters,
    SortIndicator,
    handleViewAccountDetails,
    selectedChampionIds: state.selectedChampionIds,
    setSelectedChampionIds,
    sortConfig: state.sortConfig,
    selectedSkinIds: state.selectedSkinIds,
    updatePersistedState,
    pagination: state.pagination,
    handlePageChange,
    setPageSize,
    totalPages: data?.meta.pagination.pageCount || 1,
    totalItems: data?.meta.pagination.total || 0,
    setSearchQuery,
    setSelectedSkinIds,
  };
}
