import type { AccountType } from '@/types/types';

import { CHAMPIONS, COMPANIES, LOL_TIERS, RANKS, REGIONS, SKINS, VALORANT_TIERS } from '@/components/accountsMock';
import { CoinIcon } from '@/components/coin-icon';
import { AccountGameIcon } from '@/components/GameComponents';
import { MultiSelect } from '@/components/multi-select.tsx';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

// Types

const getRegionIcon = (region: 'NA1' | 'EUW1' | 'EUNE1' | 'OCE1' | 'BR1') => {
  switch (region) {
    case 'NA1':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <path
            fill="var(--svg-bg, var(--shade9, black))"
            d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
          >
          </path>
          <path
            fill="var(--svg-fg, var(--shade0, white))"
            d="m25.394 33.509.555 6.441 3.281 3.376 4.24.617 2.804 3.451 3.881-2.881 2.437.42.908 2.83.631-5.138 1.285-3.831c2.296-1.936 3.444-3.012 3.444-3.229 0-.325.454-1.998-.216-1.493-.447.336-2.464 1.546-6.052 3.631l-.416-2.467-1.761 2.242 1.096-3.405-3.368-1.045-12.749.482z"
          >
          </path>
          <path
            fill="var(--svg-fg, var(--shade0, white))"
            d="m26.08 32.001-4.717-6.127-4.095-1.015-6.7 2.112 1.454-2.112.551-2.863h-2.005l.572-2.833 2.707-1.483 8.392 2.349 10.267.831 6.687-.315 1.853-1.674.787 1.989-3.943 3.981.908 2.131 5.612 4.252.743-7.248 2.97 1.126.379 1.87 2.243-.684 2.831 4.563-5.866 2.438-3.798 2.558-2.079-3.099-2.304-.445-13.45-.301z"
          >
          </path>
        </svg>
      );
    case 'EUW1':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <path
            fill="var(--svg-bg, var(--shade9, black))"
            d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
          >
          </path>
          <path
            fill="var(--svg-fg, var(--shade0, white))"
            d="m13.271 41.195-.428 10.061 4.907 2.481 5.763-1.035 2.344-3.024-.593-2.213 6.265-6.271 2.712.585 4.203-2.085 9.171 7.021 2.445 4.54 1.069-4.54-7.5-7.021v-2.953l2.944-2.188 2.412.517 1.075-3.071-2.445-.911-2.555.911-2.815-4.001 4.328-2.436-2.944-6.037-2.213.651-2.972-2.033 1.437 2.545-.935.676h-4.705l-2.712 2.337.895 1.267-6.567 5.512-2.344-.727L20.205 32l4.06 2.029 2.051 4.776-2.051 2.389-8.644-1.5zm5.612-13.099 7.911-1.94.731-3.529-3.268-2.404V18.37l-3.279-2.797 1.416-3.667-2.375.427V9.921L17.88 14.11l2.139 2.648 2.375 4.844-2.375 1.025-.641 2.3h3.016zm-6.216-3.429 4.379-1.264-.709-3.013.709-2.837-4.379 1.973.776 2.556-2.644 1.997z"
          >
          </path>
        </svg>
      );
    case 'OCE1':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <path
            fill="var(--svg-bg, var(--shade9, black))"
            d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
          >
          </path>
          <path
            fill="var(--svg-fg, var(--shade0, white))"
            d="M12.667 24.667v9.599h5.887l6.317-2.265 3.055 4.437 4.075 3.464h3.615l5.92-9.664-1.209-4.649-2.6-3.215-2.111-6.28-3.615 4.559-2.171-2.247.947-2.312h-3.676l-4.785 2.312zm27.354 22.666.452 2.479 4.101-3.649 2.741-2.653h1.629l2.159-4.027-2.641-4.233v4.652l-1.147 1.24-1.015 1.389z"
          >
          </path>
        </svg>
      );
    case 'EUNE1':
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="var(--svg-bg, var(--shade9, black))" d="M32 61.333C48.2 61.333 61.333 48.2 61.333 32S48.2 2.667 32 2.667 2.667 15.8 2.667 32 15.8 61.333 32 61.333z"></path><path fill="var(--svg-fg, var(--shade0, white))" d="M30.767 8h3.498l-.637 3.194 1.877 5.049 2.139 6.12-6.877 3.85-1.794-2.863 2.549-6.319-2.549-.788-.971 4.271-2.281 1.849-.587 8.203-2.122 2.463-1.131-5.82-3.359 2.768-1.781-.635-.74-4.976 4.009-3.79 3.89-8.712 6.868-3.865zm.754 23.674.584-3.614 3.4-.85v4.464l2.525 1.199 3.357 4.682 6.612 4.475-4.311 4.206-3.652-2.449-6.609 7.234L32.715 56l-8.731-9.764 2.408-4.509-3.383-.735.974-4.146 5.729-3.027 1.808-2.144z"></path></svg>'
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <path
            fill="var(--svg-bg, var(--shade9, black))"
            d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
          >
          </path>
          <path
            fill="var(--svg-fg, var(--shade0, white))"
            d="m25.394 33.509.555 6.441 3.281 3.376 4.24.617 2.804 3.451 3.881-2.881 2.437.42.908 2.83.631-5.138 1.285-3.831c2.296-1.936 3.444-3.012 3.444-3.229 0-.325.454-1.998-.216-1.493-.447.336-2.464 1.546-6.052 3.631l-.416-2.467-1.761 2.242 1.096-3.405-3.368-1.045-12.749.482z"
          >
          </path>
          <path
            fill="var(--svg-fg, var(--shade0, white))"
            d="m26.08 32.001-4.717-6.127-4.095-1.015-6.7 2.112 1.454-2.112.551-2.863h-2.005l.572-2.833 2.707-1.483 8.392 2.349 10.267.831 6.687-.315 1.853-1.674.787 1.989-3.943 3.981.908 2.131 5.612 4.252.743-7.248 2.97 1.126.379 1.87 2.243-.684 2.831 4.563-5.866 2.438-3.798 2.558-2.079-3.099-2.304-.445-13.45-.301z"
          >
          </path>
        </svg>
      );
  }
};

// Helper function to get company icon
const getCompanyIcon = (company: string) => {
  // In a real app, you would use actual company icons
  // For now, we'll use a placeholder based on the company
  return `/placeholder.svg?height=24&width=24&text=${company.split(' ')[0]}`;
};
export const Route = createFileRoute('/_protected/accounts/')({
  component: Accounts,
});

function Accounts() {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
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

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await strapiClient.find<AccountType[]>('accounts/available');
      return res.data;
    },
  });
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AccountType | null;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: null,
    direction: null,
  });

  const { getRankColor, getEloIcon } = useMapping();

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

  // Get sorted accounts
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

      // Filter by champions count (only for LoL)
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

  // Sort indicator component
  const SortIndicator = ({ column }: { column: keyof AccountType | 'coin_price' }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }

    return sortConfig.direction === 'ascending'
      ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        )
      : (
          <ArrowDown className="ml-1 h-4 w-4" />
        );
  };

  // Handle view account details
  const handleViewAccountDetails = () => {
    if (typeof window !== 'undefined' && (window as any).navigateTo) {
      (window as any).navigateTo('account-details');
    }
  };

  // Handle login to account
  // const handleLoginToAccount = (accountId: string, game: 'league' | 'valorant') => {
  //   alert(`Logging in to ${game === 'league' ? 'League of Legends' : 'Valorant'} with account: ${accountId}`);
  // };

  // Handle drop account

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if ((accounts && accounts.length === 0) || !accounts) {
    return <div>No accounts found.</div>;
  }
  return (

    <div className="space-y-6">
      {/* Header with search and view toggle */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder="Search by account ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn('flex items-center gap-1', showFilters && 'bg-zinc-100 dark:bg-zinc-800')}
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'transform rotate-180')} />
          </Button>

          {/* <div className="flex border rounded-md overflow-hidden"> */}
          {/*  <Button */}
          {/*    variant="ghost" */}
          {/*    size="sm" */}
          {/*    onClick={() => setViewMode('table')} */}
          {/*    className={cn('rounded-none px-2', viewMode === 'table' && 'bg-zinc-100 dark:bg-zinc-800')} */}
          {/*  > */}
          {/*    <LayoutList className="h-4 w-4" /> */}
          {/*  </Button> */}
          {/*  <Button */}
          {/*    variant="ghost" */}
          {/*    size="sm" */}
          {/*    onClick={() => setViewMode('card')} */}
          {/*    className={cn('rounded-none px-2', viewMode === 'card' && 'bg-zinc-100 dark:bg-zinc-800')} */}
          {/*  > */}
          {/*    <LayoutGrid className="h-4 w-4" /> */}
          {/*  </Button> */}
          {/* </div> */}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Game, Tier and Rank */}
            <div className="space-y-4">

              <div>
                <Label htmlFor="tier" className="text-sm font-medium mb-1.5 block">
                  Elo
                </Label>
                <Select value={filters.division} onValueChange={value => setFilters({ ...filters, division: value })}>
                  <SelectTrigger id="tier" className="w-full">
                    <SelectValue placeholder="Any Rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any tier</SelectItem>
                    {(filters.game === 'Valorant' ? VALORANT_TIERS : LOL_TIERS).map(tier => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rank" className="text-sm font-medium mb-1.5 block">
                  Division
                </Label>
                <Select

                  value={filters.rank}
                  onValueChange={value => setFilters({ ...filters, rank: value })}
                  disabled={['Master', 'Grandmaster', 'Challenger', 'Radiant'].includes(filters.division)}
                >
                  <SelectTrigger id="rank" className="w-full">
                    <SelectValue placeholder="Any division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any division</SelectItem>
                    {RANKS.map(rank => (
                      <SelectItem key={rank} value={rank}>
                        {rank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="region" className="text-sm font-medium mb-1.5 block">
                  Region
                </Label>
                <Select value={filters.region} onValueChange={value => setFilters({ ...filters, region: value })}>
                  <SelectTrigger id="region" className="h-9">
                    <SelectValue placeholder="Any region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any region</SelectItem>
                    {REGIONS.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Champions and Skins */}
            <div className="space-y-4">

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Specific Champions</Label>
                <MultiSelect
                  options={CHAMPIONS}
                  selected={filters.selectedChampions}
                  onChange={value => setFilters({ ...filters, selectedChampions: value })}
                  placeholder="Select champions"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Specific Skins</Label>
                <MultiSelect
                  options={SKINS}
                  selected={filters.selectedSkins}
                  onChange={value => setFilters({ ...filters, selectedSkins: value })}
                  placeholder="Select skins"
                />
              </div>
            </div>

            {/* Company and Status */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Company</Label>
                <div className="grid grid-cols-3 gap-3">
                  {COMPANIES.map(company => (
                    <div
                      key={company}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all',
                        filters.company === company
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                      )}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          company: filters.company === company ? '' : company,
                        })}
                    >
                      <div className="relative mb-2">
                        <img
                          src={getCompanyIcon(company) || '/placeholder.svg'}
                          alt={company}
                          className="w-8 h-8 rounded-md"
                        />
                        {filters.company === company && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-center">{company}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
                  Reset All Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Showing
        {' '}
        {filteredAccounts.length}
        {' '}
        of
        {' '}
        {accounts.length}
        {' '}
        accounts
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Game</th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">ID</th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Rank</th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Region</th>
                <th
                  className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  onClick={() => requestSort('LCUchampions')}
                >
                  <div className="flex items-center">
                    Champions
                    <SortIndicator column="LCUchampions" />
                  </div>
                </th>
                <th
                  className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  onClick={() => requestSort('LCUskins')}
                >
                  <div className="flex items-center">
                    Skins
                    <SortIndicator column="LCUskins" />
                  </div>
                </th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Company</th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                <th
                  className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  onClick={() => requestSort('LCUchampions')}
                >
                  <div className="flex items-center">
                    Price
                    <SortIndicator column="coin_price" />
                  </div>
                </th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => {
                // Move variable declaration inside the function body
                const ranking = account.rankings.find(ranking => ranking.queueType === 'soloqueue') as any;

                return (
                  <tr
                    key={account.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer"
                    onClick={() => handleViewAccountDetails()}
                  >
                    <td className="p-3">
                      <AccountGameIcon game="lol" />
                    </td>
                    <td className="p-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.documentId.slice(0, 6).toUpperCase()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img className="w-4 h-4" alt={ranking.elo} src={getEloIcon(ranking.elo)} />
                        <span className={`text-sm font-medium ${getRankColor(ranking?.elo)}`}>
                          {ranking?.division || ranking.division}
                          {' '}
                          {ranking?.elo || ranking.elo}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-6">{getRegionIcon(account.server)}</div>
                        {/* <img */}
                        {/*  src={getRegionIcon(account.server) || '/placeholder.svg'} */}
                        {/*  alt={account.server} */}
                        {/*  className="w-5 h-5" */}
                        {/* /> */}
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{account.server}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {account.LCUchampions}
                    </td>
                    <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">{account.LCUskins}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={getCompanyIcon(account.type) || '/placeholder.svg'}
                          alt={account.type}
                          className="w-5 h-5 rounded-md"
                        />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{account.type}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          !account.user
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : account.user
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                        )}
                      >
                        {account.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        {/* {account.price.toLocaleString()} */}
                      </div>
                    </td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleViewAccountDetails}>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Rent Account</DropdownMenuItem>
                          <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {/* {viewMode === 'card' && ( */}
      {/*  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> */}
      {/*    {filteredAccounts.map((account) => { */}
      {/*      const ranking = account.rankings.find(ranking => ranking.queueType === 'soloqueue'); */}

      {/*      return ( */}
      {/*        <div */}
      {/*          key={account.id} */}
      {/*          className="bg-white dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" */}
      {/*          onClick={() => handleViewAccountDetails()} */}
      {/*        > */}
      {/*          <div className="p-4"> */}
      {/*            <div className="flex items-center justify-between mb-3"> */}
      {/*              <div className="flex items-center gap-2"> */}
      {/*                <AccountGameIcon game="lol" /> */}
      {/*                <span className="text-sm font-medium">{account.documentId?.slice(0, 6)}</span> */}
      {/*              </div> */}
      {/*              <span */}
      {/*                className={cn( */}
      {/*                  'px-2 py-1 rounded-full text-xs font-medium', */}
      {/*                  !account.user */}
      {/*                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' */}
      {/*                    : account.user */}
      {/*                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' */}
      {/*                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', */}
      {/*                )} */}
      {/*              > */}
      {/*                {account.type} */}
      {/*              </span> */}
      {/*            </div> */}

      {/*            <div className="flex items-center gap-2 mb-3"> */}
      {/*              <img */}
      {/*                src={getTierIcon(ranking?.division || '') || '/placeholder.svg'} */}
      {/*                alt={ranking?.division || ''} */}
      {/*                className="w-5 h-5" */}
      {/*              /> */}
      {/*              <div> */}
      {/*                <p className={`text-sm font-medium ${getRankColor(ranking?.division || '')}`}> */}
      {/*                  {ranking?.division || ''} */}
      {/*                  {' '} */}
      {/*                  {ranking?.elo || ''} */}
      {/*                </p> */}
      {/*                <div className="flex items-center gap-1 mt-0.5"> */}
      {/*                  <img */}
      {/*                    src={getRegionIcon(account.server) || '/placeholder.svg'} */}
      {/*                    alt={account.server} */}
      {/*                    className="w-4 h-4" */}
      {/*                  /> */}
      {/*                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{account.server}</span> */}
      {/*                </div> */}
      {/*              </div> */}
      {/*            </div> */}

      {/*            <div className="grid grid-cols-2 gap-3 mb-3"> */}
      {/*              <div> */}
      {/*                <p className="text-xs text-zinc-600 dark:text-zinc-400">Champions</p> */}
      {/*                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.LCUchampions}</p> */}
      {/*              </div> */}
      {/*              <div> */}
      {/*                <p className="text-xs text-zinc-600 dark:text-zinc-400">Skins</p> */}
      {/*                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.LCUskins}</p> */}
      {/*              </div> */}
      {/*            </div> */}

      {/*            <div className="flex items-center justify-between mb-3"> */}
      {/*              <div className="flex items-center gap-1.5"> */}
      {/*                <img */}
      {/*                  src={getCompanyIcon(account.type) || '/placeholder.svg'} */}
      {/*                  alt={account.type} */}
      {/*                  className="w-4 h-4 rounded-md" */}
      {/*                /> */}
      {/*                <p className="text-xs text-zinc-600 dark:text-zinc-400">{account.type}</p> */}
      {/*              </div> */}
      {/*              <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"> */}
      {/*                <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> */}
      {/*                /!* {account.coins && account.coins.toLocaleString()} *!/ */}
      {/*              </div> */}
      {/*            </div> */}
      {/*          </div> */}
      {/*          <div className="flex border-t border-zinc-100 dark:border-zinc-800" onClick={e => e.stopPropagation()}> */}
      {/*            <Button */}
      {/*              variant="ghost" */}
      {/*              className="flex-1 rounded-none text-xs h-10 text-zinc-600 dark:text-zinc-400" */}
      {/*              // onClick={() => handleViewAccountDetails(account)} */}
      {/*            > */}
      {/*              View Details */}
      {/*            </Button> */}
      {/*            <div className="w-px bg-zinc-100 dark:bg-zinc-800" /> */}
      {/*            <Button */}
      {/*              variant="ghost" */}
      {/*              className="flex-1 rounded-none text-xs h-10 text-zinc-600 dark:text-zinc-400" */}
      {/*              disabled={!!account.user} */}
      {/*            > */}
      {/*              Rent Now */}
      {/*            </Button> */}
      {/*          </div> */}
      {/*        </div> */}
      {/*      ); */}
      {/*    })} */}
      {/*  </div> */}
      {/* )} */}

    </div>
  );
}
