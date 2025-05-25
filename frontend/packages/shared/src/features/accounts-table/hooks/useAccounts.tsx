import type { AccountType, Server } from '@/types/types.ts';
import type { StrapiResponse } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';

import { strapiClient } from '@/lib/strapi.ts';

import { useMapping } from '@/lib/useMapping.tsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import debounce from 'lodash/debounce';
// Import lodash get for safe property access
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const availableRegions: Server[] = [
  'NA1',
  'EUW1',
  'EUN1',
  'OC1',
  'BR1',
  'LA1',
  'LA2',
  'RU',
  'TR1',
  'ME1',
];

type SortKey = keyof AccountType | 'coin_price' | 'price' | 'winrate' | 'blueEssence' | 'LCUchampions' | 'LCUskins';

export type FilterState = {
  leaverStatus: string[];
  game: string;
  divisions: string[];
  ranks: string[];
  queueType: string; // Add queueType property
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
    pageCount?: number;
  };
};
export function useAccounts(initialPage = 1, initialPageSize = 20) {
  const DEFAULT_STATE: AccountsState = useMemo(() => ({
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
      queueType: 'soloqueue', // Add default queue type
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
  }), []);
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
  const [sliderValue, setSliderValue] = useState<number>(
    persistedState.filters.minBlueEssence || 0,
  );

  // Create a debounced filter update function
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
  }, [queryClient, state.pagination.pageSize, DEFAULT_STATE]);

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

    if (filters.company && filters.company !== '') {
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
    const queueTypeFilter = filters.queueType || 'soloqueue'; // Default queue type
    const inputRanks = filters.ranks?.map(rank => rank.toUpperCase()) || [];
    const divisions = filters.divisions || [];

    const hasRankOrDivisionFilters = inputRanks.length > 0 || divisions.length > 0;

    if (hasRankOrDivisionFilters) {
      const orConditions: any[] = [];

      const selectedIsUnranked = inputRanks.includes('UNRANKED');
      const selectedDefinedRanks = inputRanks.filter(r => r !== 'UNRANKED');

      // Helper to build conditions for defined ranks/divisions
      const buildDefinedRankDivisionMatcher = (ranksToMatch: string[], divsToMatch: string[]) => {
        const conditions: any[] = [];
        if (ranksToMatch.length > 0 && divsToMatch.length > 0) {
          for (const rank of ranksToMatch) {
            for (const division of divsToMatch) {
              conditions.push({ $and: [{ elo: { $eqi: rank } }, { division: { $eqi: division } }] });
            }
          }
        } else if (ranksToMatch.length > 0) {
          conditions.push({ elo: { $in: ranksToMatch } });
        } else if (divsToMatch.length > 0) {
          // This case handles when only divisions are selected, implying any defined rank within those divisions.
          conditions.push({ division: { $in: divsToMatch } });
        }
        // Return a single condition object if only one, or an $or for multiple.
        // If conditions array is empty, return null.
        if (conditions.length === 0) {
          return null;
        }
        return conditions.length === 1 ? conditions[0] : { $or: conditions };
      };

      const definedRankDivisionMatcher = buildDefinedRankDivisionMatcher(selectedDefinedRanks, divisions);

      // Condition 1: Current/provisory rank matches a *defined* selected rank/division
      if (definedRankDivisionMatcher) {
        orConditions.push({
          rankings: {
            $and: [
              { queueType: { $eqi: queueTypeFilter } },
              { type: { $in: ['current', 'provisory'] } },
              { elo: { $nin: ['unranked', '', null] } }, // Elo must be defined (not unranked, empty, or null)
              definedRankDivisionMatcher,
            ],
          },
        });
      }

      // Condition 2: If "UNRANKED" is selected, current/provisory rank is unranked/empty/non-existent
      if (selectedIsUnranked) {
        orConditions.push({
          rankings: {
            $and: [
              { queueType: { $eqi: queueTypeFilter } },
              { type: { $in: ['current', 'provisory'] } },
              {
                $or: [ // Elo is unranked, empty, or does not exist
                  { elo: { $eqi: 'unranked' } },
                  { elo: { $eqi: '' } },
                  { elo: { $exists: false } },
                ],
              },
            ],
          },
        });
      }

      // Condition 3: Current/provisory is unranked/empty, BUT previous rank matches a *defined* selected rank/division
      if (definedRankDivisionMatcher) {
        orConditions.push({
          $and: [
            { // Current/provisory is unranked/empty/non-existent
              rankings: {
                $and: [
                  { queueType: { $eqi: queueTypeFilter } },
                  { type: { $in: ['current', 'provisory'] } },
                  {
                    $or: [
                      { elo: { $eqi: 'unranked' } },
                      { elo: { $eqi: '' } },
                      { elo: { $exists: false } },
                    ],
                  },
                ],
              },
            },
            { // Previous rank matches defined criteria
              rankings: {
                $and: [
                  { queueType: { $eqi: queueTypeFilter } },
                  { type: { $eqi: 'previous' } },
                  { elo: { $nin: ['unranked', '', null] } }, // Previous Elo must be defined
                  definedRankDivisionMatcher,
                ],
              },
            },
          ],
        });
      }

      if (orConditions.length > 0) {
        strapiFilters.$or = orConditions;
      }
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
  const { data: rawData, isLoading, isFetching } = useQuery({ // Use isFetching for loading indicators during background updates
    queryKey: ['accounts', state.filters, state.searchQuery, state.pagination.page, state.pagination.pageSize, state.sortConfig],
    queryFn: async () => {
      const queryParams = buildQueryParams(state.pagination.page);
      return await strapiClient.find<AccountType[]>('accounts/available', queryParams) as StrapiResponse<AccountType[]>;
    },
  });

  const debouncedSetBlueEssence = useMemo(() =>
    debounce((value: number) => {
      setFilters({
        ...state.filters,
        minBlueEssence: value,
      });
    }, 200), [setFilters, state.filters]);
  // Function to update slider value immediately (for UI) but debounce the actual filter
  const handleBlueEssenceChange = useCallback((value: number) => {
    setSliderValue(value);
    debouncedSetBlueEssence(value);
  }, [debouncedSetBlueEssence]);

  // Clean up the debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetBlueEssence.cancel();
    };
  }, [debouncedSetBlueEssence]);
  // Prefetch next page
  useEffect(() => {
    if (rawData) {
      const nextPage = state.pagination.page + 1;
      if (nextPage <= Math.ceil(rawData.meta.pagination.total / state.pagination.pageSize)) {
        queryClient.prefetchQuery({
          queryKey: ['accounts', state.filters, state.searchQuery, nextPage, state.pagination.pageSize, state.sortConfig],
          queryFn: async () => {
            const queryParams = buildQueryParams(nextPage);
            return await strapiClient.find<AccountType[]>('accounts/available', queryParams);
          },
        });
      }
    }
  }, [rawData, state, queryClient, buildQueryParams]);

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
  const processedData = rawData || { data: [], meta: { pagination: { page: 1, pageSize: state.pagination.pageSize, pageCount: 0, total: 0 } } };

  return {
    availableRegions,
    searchQuery: state.searchQuery,
    filteredAccounts: processedData.data,
    showFilters: state.showFilters,
    setShowFilters,
    filters: state.filters,
    setFilters,
    data: rawData,
    isLoading: isLoading || isFetching,
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
    totalPages: processedData.meta.pagination.pageCount || 1,
    totalItems: processedData.meta.pagination.total || 0,
    setSearchQuery,
    setSelectedSkinIds,
    sliderValue,
    handleBlueEssenceChange,
  };
}
