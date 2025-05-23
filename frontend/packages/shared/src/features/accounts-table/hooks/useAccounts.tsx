import type { AccountType, Server } from '@/types/types.ts';
import type { StrapiResponse } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';

import { strapiClient } from '@/lib/strapi.ts';

import { useMapping } from '@/lib/useMapping.tsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import debounce from 'lodash/debounce';
// Import lodash get for safe property access
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
  };
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

    // Both ranks and divisions selected
    // Rank and division filters
    const queueTypeFilter = filters.queueType || 'soloqueue'; // Default queue type

    // Helper conditions for a "defined" ELO (not UNRANKED and not empty string)
    const definedEloConditions = [
      { elo: { $nei: 'unranked' } },
      { elo: { $ne: '' } },
    ];

    // Helper conditions for "undefined" ELO (is UNRANKED or is empty string)
    const undefinedEloConditions = {
      $or: [
        { elo: { $eqi: 'unranked' } },
        { elo: { $eqi: '' } },
      ],
    };

    // Base conditions for matching the filter criteria (rank/division)
    const filterCriteriaConditions: any[] = [];
    if (filters.ranks?.length > 0 && filters.divisions?.length > 0) {
      const combinationFilters: any[] = [];
      for (const rank of filters.ranks) {
        for (const division of filters.divisions) {
          combinationFilters.push({
            $and: [
              { elo: { $eqi: rank.toUpperCase() } },
              { division: { $eqi: division } },
            ],
          });
        }
      }
      if (combinationFilters.length > 0) {
        filterCriteriaConditions.push({ $or: combinationFilters });
      }
    } else if (filters.ranks?.length > 0) {
      filterCriteriaConditions.push({ elo: { $in: filters.ranks.map(rank => rank.toUpperCase()) } });
    } else if (filters.divisions?.length > 0) {
      filterCriteriaConditions.push({ division: { $in: filters.divisions } });
    }

    // Only apply ranking filters if ranks or divisions are selected
    if (filterCriteriaConditions.length > 0) {
      strapiFilters.$or = [
        // Scenario 1: Account HAS a defined current/provisory rank for the queue, AND it matches the filter.
        {
          rankings: {
            $and: [
              { queueType: { $eqi: queueTypeFilter } },
              { type: { $in: ['current', 'provisory'] } },
              ...definedEloConditions, // Ensures the current/provisory rank is defined
              ...filterCriteriaConditions, // Ensures this defined rank matches the filter
            ],
          },
        },
        // Scenario 2: Account HAS current/provisory rank that is unranked or empty,
        // AND has a previous rank that matches the filter
        {
          $and: [
            // Condition 2a: HAS current/provisory rank that is unranked or empty
            {
              rankings: {
                $and: [
                  { queueType: { $eqi: queueTypeFilter } },
                  { type: { $in: ['current', 'provisory'] } },
                  undefinedEloConditions, // Check for unranked or empty ELO
                ],
              },
            },
            // Condition 2b: Check if the previous rank matches the filter criteria
            {
              rankings: {
                $and: [
                  { queueType: { $eqi: queueTypeFilter } },
                  { type: { $eqi: 'previous' } },
                  ...filterCriteriaConditions, // Check if previous rank matches
                ],
              },
            },
          ],
        },
      ];
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
    placeholderData: previousData => previousData, // Keep previous data while loading new
    // ** NEW: Use `select` to apply custom sorting **
    // select: (response: StrapiResponse<AccountType[]>) => {
    //   const fetchedData = response.data;
    //   const meta = response.meta;
    //
    //   // Check if rank/division filters are active
    //   const rankFiltersActive = state.filters.ranks?.length > 0 || state.filters.divisions?.length > 0;
    //
    //   if (!rankFiltersActive || !fetchedData) {
    //     // If filters not active or no data, return as is
    //     return { data: fetchedData || [], meta };
    //   }
    //
    //   const queueTypeFilter = state.filters.queueType || 'soloqueue';
    //
    //   // Create a mutable copy for sorting
    //   const sortedData = [...fetchedData].sort((a, b) => {
    //     // 1. Primary Sort: Custom Rank Priority
    //     const priorityA = getAccountRankPriority(a, state.filters, queueTypeFilter);
    //     const priorityB = getAccountRankPriority(b, state.filters, queueTypeFilter);
    //
    //     if (priorityA !== priorityB) {
    //       return priorityA - priorityB; // Lower priority number comes first
    //     }
    //
    //     // 2. Secondary Sort: User-selected sortConfig (if priorities are equal)
    //     if (state.sortConfig.key && state.sortConfig.direction) {
    //       const { key, direction } = state.sortConfig;
    //       // Use lodash get for safe access to potentially nested keys
    //       const valueA = get(a, key, null);
    //       const valueB = get(b, key, null);
    //
    //       // Basic comparison (adjust for specific types like numbers, strings if needed)
    //       const comparison = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
    //
    //       return direction === 'ascending' ? comparison : -comparison;
    //     }
    //
    //     // 3. Tertiary Sort: Maintain original relative order (or add another default like ID)
    //     return 0; // Or return a.id - b.id; if IDs are numbers
    //   });
    //
    //   return { data: sortedData, meta }; // Return structure with sorted data
    // },
  });

  const debouncedSetBlueEssence = useCallback(
    debounce((value: number) => {
      setFilters({
        ...state.filters,
        minBlueEssence: value,
      });
    }, 200),
    [setFilters, state.filters],
  );
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
