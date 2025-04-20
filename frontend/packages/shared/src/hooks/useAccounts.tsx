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
type SortKey = keyof AccountType | 'coin_price' | 'winrate' | 'blueEssence';

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

export function useAccounts(page = 1, pageSize = 10) {
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
    pagination: {
      page: 1,
      pageSize: 20,
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
  const [pagination, setPagination] = useState(persistedState.pagination || { page, pageSize });

  const { getRankColor, getEloIcon, getRegionIcon, getGameIcon } = useMapping();

  // Update persisted state when filters or pagination change
  const updatePersistedState = useCallback(() => {
    queryClient.setQueryData(['accounts-filter-state'], {
      searchQuery,
      showFilters,
      selectedChampionIds,
      selectedSkinIds,
      filters,
      sortConfig,
      pagination,
    });
  }, [queryClient, searchQuery, showFilters, selectedChampionIds, selectedSkinIds, filters, sortConfig, pagination]);

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

  // New function to update pagination
  const setPaginationPersisted = useCallback((newPagination: typeof pagination) => {
    setPagination(newPagination);
    queryClient.setQueryData(['accounts-filter-state'], (old: any) => ({ ...old, pagination: newPagination }));
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

      pagination: {
        page: 1,
        pageSize: 10,
      },
    };

    setSearchQuery(initialState.searchQuery);
    setSelectedChampionIds(initialState.selectedChampionIds);
    setSelectedSkinIds(initialState.selectedSkinIds);
    setFilters(initialState.filters);
    setSortConfig(initialState.sortConfig);
    setPagination(initialState.pagination);

    // Reset persisted state
    queryClient.setQueryData(['accounts-filter-state'], initialState);
  }, [queryClient]);

  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', filters, searchQuery, pagination.page, pagination.pageSize, sortConfig],
    queryFn: async () => {
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

      // Champions filter
      if (filters.selectedChampions && filters.selectedChampions.length > 0) {
        strapiFilters.LCUchampions = {
          $containsi: filters.selectedChampions.map(id => Number.parseInt(id)),
        };
      }

      // Skins filter
      if (filters.selectedSkins && filters.selectedSkins.length > 0) {
        strapiFilters.LCUskins = {
          $containsi: filters.selectedSkins.map(id => Number.parseInt(id)),
        };
      }

      // Rank and division filters - if these rely on related data structure
      if ((filters.rank && filters.rank !== 'any') || (filters.division && filters.division !== 'any')) {
        strapiFilters.rankings = {
          queueType: 'soloqueue',
          type: 'current',
        };

        if (filters.rank && filters.rank !== 'any') {
          strapiFilters.rankings.elo = { $eqi: filters.rank };
        }

        if (filters.division && filters.division !== 'any') {
          strapiFilters.rankings.division = filters.division;
        }
      }

      // Prepare parameters for the request
      const queryParams: any = {
        filters: strapiFilters,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
      };

      // Add sorting if configured
      if (sortConfig.key && sortConfig.direction) {
        const sortDirection = sortConfig.direction === 'ascending' ? 'asc' : 'desc';

        // Handle special sort cases and map to the correct field names
        if (sortConfig.key === 'LCUchampions') {
          queryParams.sort = `LCUchampions_count:${sortDirection}`;
        } else if (sortConfig.key === 'LCUskins') {
          queryParams.sort = `LCUskins_count:${sortDirection}`;
        } else if (sortConfig.key === 'coin_price') {
          queryParams.sort = `rankings.elo:${sortDirection}`;
        } else if (sortConfig.key === 'winrate') {
          queryParams.sort = `rankings.wins:${sortDirection}`;
        } else if (sortConfig.key === 'blueEssence') {
          queryParams.sort = `blueEssence:${sortDirection}`;
        } else {
          // Default sort for regular fields
          queryParams.sort = `${sortConfig.key}:${sortDirection}`;
        }
      }

      return await strapiClient.find<AccountType[]>('accounts/available', queryParams) as StrapiResponse<AccountType[]>;
    },
  });

  // Use useEffect for prefetching the next page when data changes
  useEffect(() => {
    if (data) {
      const nextPage = pagination.page + 1;
      if (nextPage <= Math.ceil(data.meta.pagination.total / pagination.pageSize)) {
        queryClient.prefetchQuery({
          queryKey: ['accounts', filters, searchQuery, nextPage, pagination.pageSize, sortConfig],
          queryFn: async () => {
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

            // Champions filter - use comma-separated array instead of $and conditions
            if (filters.selectedChampions && filters.selectedChampions.length > 0) {
              strapiFilters.LCUchampions = {
                $containsi: filters.selectedChampions.map(id => Number.parseInt(id)),
              };
            }

            // Skins filter - use comma-separated array instead of $and conditions
            if (filters.selectedSkins && filters.selectedSkins.length > 0) {
              strapiFilters.LCUskins = {
                $containsi: filters.selectedSkins.map(id => Number.parseInt(id)),
              };
            }

            // Rank and division filters - if these rely on related data structure
            if ((filters.rank && filters.rank !== 'any') || (filters.division && filters.division !== 'any')) {
              strapiFilters.rankings = {
                queueType: 'soloqueue',
                type: 'current',
              };

              if (filters.rank && filters.rank !== 'any') {
                strapiFilters.rankings.elo = { $eqi: filters.rank };
              }

              if (filters.division && filters.division !== 'any') {
                strapiFilters.rankings.division = filters.division;
              }
            }

            // Prepare parameters for the request
            const queryParams: any = {
              filters: strapiFilters,
              pagination: {
                page: nextPage,
                pageSize: pagination.pageSize,
              },
            };

            // Add sorting if configured - using same format as main query
            if (sortConfig.key && sortConfig.direction) {
              const sortDirection = sortConfig.direction === 'ascending' ? 'asc' : 'desc';

              // Handle special sort cases
              if (sortConfig.key === 'LCUchampions') {
                queryParams.sort = `LCUchampions_count:${sortDirection}`;
              } else if (sortConfig.key === 'LCUskins') {
                queryParams.sort = `LCUskins_count:${sortDirection}`;
              } else if (sortConfig.key === 'coin_price') {
                queryParams.sort = `rankings.elo:${sortDirection}`;
              } else if (sortConfig.key === 'winrate') {
                queryParams.sort = `rankings.wins:${sortDirection}`;
              } else if (sortConfig.key === 'blueEssence') {
                queryParams.sort = `blueEssence:${sortDirection}`;
              } else {
                // Default sort for regular fields
                queryParams.sort = `${sortConfig.key}:${sortDirection}`;
              }
            }

            return await strapiClient.find<AccountType[]>('accounts/available', queryParams);
          },
        });
      }
    }
  }, [data, filters, pagination, queryClient, searchQuery, sortConfig]);

  const handleViewAccountDetails = (accountId: string) => {
    router.navigate({ to: `/accounts/${accountId}` });
  };
  const SortIndicator = ({ column }: { column: SortKey }) => {
    // Add null check here too
    if (!sortConfig || sortConfig.key !== column || sortConfig.direction === null) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }

    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPaginationPersisted({ ...pagination, page: newPage });
  }, [pagination, setPaginationPersisted]);

  return {
    availableRegions,
    searchQuery,
    filteredAccounts: data?.data || [],
    setSearchQuery,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    data,
    isLoading,
    getRankColor,
    getEloIcon,
    getRegionIcon,
    getGameIcon,
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
    sortConfig,
    selectedSkinIds,
    updatePersistedState,
    pagination,
    handlePageChange,
    totalPages: data?.meta.pagination.pageCount || 1,
    totalItems: data?.meta.pagination.total || 0,
  };
}
