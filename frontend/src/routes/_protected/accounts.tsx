import type { Account } from '@/components/accountsMock';
import { ACCOUNTS, CHAMPIONS, COMPANIES, GAMES, LOL_TIERS, RANKS, REGIONS, SKINS, STATUSES, VALORANT_TIERS } from '@/components/accountsMock';

import { CoinIcon } from '@/components/coin-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Filter,
  LayoutGrid,
  LayoutList,
  LogIn,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const getGameIcon = (game: 'lol' | 'valorant') => {
  if (game === 'lol') {
    return '/placeholder.svg?height=24&width=24&text=LoL';
  } else {
    return '/placeholder.svg?height=24&width=24&text=VAL';
  }
};
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 px-3 text-sm"
        >
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="max-h-[300px]">
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option}
                  onSelect={() => {
                    onChange(
                      selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option],
                    );
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selected.includes(option) ? 'opacity-100' : 'opacity-0')} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Types

// Helper function to get rank color
const getRankColor = (tier: string) => {
  switch (tier.toLowerCase()) {
    case 'iron':
    case 'bronze':
      return 'text-zinc-600 dark:text-zinc-400';
    case 'silver':
      return 'text-zinc-400 dark:text-zinc-300';
    case 'gold':
      return 'text-amber-500 dark:text-amber-400';
    case 'platinum':
      return 'text-cyan-500 dark:text-cyan-400';
    case 'diamond':
      return 'text-blue-500 dark:text-blue-400';
    case 'master':
      return 'text-purple-500 dark:text-purple-400';
    case 'grandmaster':
      return 'text-red-500 dark:text-red-400';
    case 'challenger':
      return 'text-yellow-500 dark:text-yellow-400';
    default:
      return 'text-zinc-600 dark:text-zinc-400';
  }
};

// Helper function to get tier icon
const getTierIcon = (tier: string) => {
  // In a real app, you would use actual tier icons
  // For now, we'll use a placeholder based on the tier
  return `/placeholder.svg?height=24&width=24&text=${tier.charAt(0)}`;
};

// Helper function to get region icon
const getRegionIcon = (region: string) => {
  // In a real app, you would use actual region icons
  // For now, we'll use a placeholder based on the region
  return `/placeholder.svg?height=24&width=24&text=${region}`;
};

// Helper function to get company icon
const getCompanyIcon = (company: string) => {
  // In a real app, you would use actual company icons
  // For now, we'll use a placeholder based on the company
  return `/placeholder.svg?height=24&width=24&text=${company.split(' ')[0]}`;
};
export const Route = createFileRoute('/_protected/accounts')({
  component: RouteComponent,
});

function RouteComponent() {
  // State
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);
  const [accountToDropId, setAccountToDropId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    game: '',
    tier: '',
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

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Account | null;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: null,
    direction: null,
  });

  // Handle sorting
  const requestSort = (key: keyof Account) => {
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
    const sortableAccounts = [...ACCOUNTS];

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
  }, [sortConfig]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return sortedAccounts.filter((account) => {
      // Search by ID
      if (searchQuery && !account.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by game
      if (
        filters.game
        && ((filters.game === 'League of Legends' && account.game !== 'lol')
          || (filters.game === 'Valorant' && account.game !== 'valorant'))
      ) {
        return false;
      }

      // Filter by tier
      if (filters.tier && account.tier !== filters.tier) {
        return false;
      }

      // Filter by rank
      if (filters.rank && account.rank !== filters.rank) {
        return false;
      }

      // Filter by region
      if (filters.region && account.region !== filters.region) {
        return false;
      }

      // Filter by champions count (only for LoL)
      if (
        account.game === 'lol'
        && (account.champions < filters.minChampions || account.champions > filters.maxChampions)
      ) {
        return false;
      }

      // Filter by skins count
      if (account.skins < filters.minSkins || account.skins > filters.maxSkins) {
        return false;
      }

      // Filter by company
      if (filters.company && account.company !== filters.company) {
        return false;
      }

      // Filter by status
      if (filters.status && account.status !== filters.status) {
        return false;
      }

      // In a real app, you would filter by specific champions and skins
      // For this demo, we'll just simulate it

      return true;
    });
  }, [sortedAccounts, searchQuery, filters]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      game: '',
      tier: '',
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
  const SortIndicator = ({ column }: { column: keyof Account }) => {
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
      ; (window as any).navigateTo('account-details');
    }
  };

  // Handle login to account
  const handleLoginToAccount = (accountId: string, game: 'lol' | 'valorant') => {
    alert(`Logging in to ${game === 'lol' ? 'League of Legends' : 'Valorant'} with account: ${accountId}`);
  };

  // Handle drop account
  const handleDropAccount = (accountId: string) => {
    setAccountToDropId(null);
    setIsDropDialogOpen(false);
    alert(`Account ${accountId} has been dropped and refunded.`);
  };

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

          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn('rounded-none px-2', viewMode === 'table' && 'bg-zinc-100 dark:bg-zinc-800')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('card')}
              className={cn('rounded-none px-2', viewMode === 'card' && 'bg-zinc-100 dark:bg-zinc-800')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Game, Tier and Rank */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="game" className="text-sm font-medium mb-1.5 block">
                  Game
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {GAMES.map(game => (
                    <div
                      key={game}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all',
                        filters.game === game
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                      )}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          game: filters.game === game ? '' : game,
                        })}
                    >
                      <div className="relative mb-2">
                        <img
                          src={getGameIcon(game === 'League of Legends' ? 'lol' : 'valorant')}
                          alt={game}
                          className="w-8 h-8 rounded-md"
                        />
                        {filters.game === game && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-center">{game}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="tier" className="text-sm font-medium mb-1.5 block">
                  Tier
                </Label>
                <Select value={filters.tier} onValueChange={value => setFilters({ ...filters, tier: value })}>
                  <SelectTrigger id="tier" className="h-9">
                    <SelectValue placeholder="Any tier" />
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
                  disabled={['Master', 'Grandmaster', 'Challenger', 'Radiant'].includes(filters.tier)}
                >
                  <SelectTrigger id="rank" className="h-9">
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
              {filters.game !== 'Valorant' && (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    Champions (
                    {filters.minChampions}
                    {' '}
                    -
                    {' '}
                    {filters.maxChampions}
                    )
                  </Label>
                  <Slider
                    defaultValue={[filters.minChampions, filters.maxChampions]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={value =>
                      setFilters({
                        ...filters,
                        minChampions: value[0],
                        maxChampions: value[1],
                      })}
                    className="my-4"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Skins (
                  {filters.minSkins}
                  {' '}
                  -
                  {' '}
                  {filters.maxSkins}
                  )
                </Label>
                <Slider
                  defaultValue={[filters.minSkins, filters.maxSkins]}
                  min={0}
                  max={150}
                  step={1}
                  onValueChange={value =>
                    setFilters({
                      ...filters,
                      minSkins: value[0],
                      maxSkins: value[1],
                    })}
                  className="my-4"
                />
              </div>

              {filters.game !== 'Valorant' && (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Specific Champions</Label>
                  <MultiSelect
                    options={CHAMPIONS}
                    selected={filters.selectedChampions}
                    onChange={value => setFilters({ ...filters, selectedChampions: value })}
                    placeholder="Select champions"
                  />
                </div>
              )}

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

              <div>
                <Label className="text-sm font-medium mb-3 block">Status</Label>
                <div className="flex gap-3">
                  {STATUSES.map(status => (
                    <Badge
                      key={status}
                      variant="outline"
                      className={cn(
                        'cursor-pointer py-1.5 px-3',
                        filters.status === status
                          ? status === 'Available'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : status === 'Rented'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      )}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          status: filters.status === status ? '' : status,
                        })}
                    >
                      {status}
                    </Badge>
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
        {ACCOUNTS.length}
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
                  onClick={() => requestSort('champions')}
                >
                  <div className="flex items-center">
                    Champions
                    <SortIndicator column="champions" />
                  </div>
                </th>
                <th
                  className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  onClick={() => requestSort('skins')}
                >
                  <div className="flex items-center">
                    Skins
                    <SortIndicator column="skins" />
                  </div>
                </th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Company</th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                <th
                  className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  onClick={() => requestSort('price')}
                >
                  <div className="flex items-center">
                    Price
                    <SortIndicator column="price" />
                  </div>
                </th>
                <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => (
                <tr
                  key={account.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer"
                  onClick={() => handleViewAccountDetails()}
                >
                  <td className="p-3">
                    <img
                      src={getGameIcon(account.game) || '/placeholder.svg'}
                      alt={account.game === 'lol' ? 'League of Legends' : 'Valorant'}
                      className="w-6 h-6"
                    />
                  </td>
                  <td className="p-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.id}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={getTierIcon(account.tier) || '/placeholder.svg'}
                        alt={account.tier}
                        className="w-5 h-5"
                      />
                      <span className={`text-sm font-medium ${getRankColor(account.tier)}`}>
                        {account.tier}
                        {' '}
                        {account.rank}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={getRegionIcon(account.region) || '/placeholder.svg'}
                        alt={account.region}
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{account.region}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {account.game === 'lol' ? account.champions : '-'}
                  </td>
                  <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">{account.skins}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={getCompanyIcon(account.company) || '/placeholder.svg'}
                        alt={account.company}
                        className="w-5 h-5 rounded-md"
                      />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{account.company}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        account.status === 'Available'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : account.status === 'Rented'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {account.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      {account.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    {account.isRentedByUser
                      ? (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleLoginToAccount(account.id, account.game)}
                            >
                              <LogIn className="h-4 w-4 mr-1" />
                              Login
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                  <ArrowDownToLine className="h-4 w-4 mr-1" />
                                  Drop
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Drop Account & Refund</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to drop this account? You will be refunded
                                    {' '}
                                    {account.refundableAmount}
                                    {' '}
                                    coins.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300">
                                  <p>
                                    This action cannot be undone. The account will be immediately returned to the available
                                    pool.
                                  </p>
                                </div>
                                <DialogFooter className="flex gap-3 sm:justify-end">
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDropAccount(account.id)}
                                    className="flex items-center gap-1"
                                  >
                                    <ArrowDownToLine className="h-4 w-4" />
                                    Drop & Refund
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )
                      : (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 bg-blue-600 hover:bg-blue-700"
                            disabled={account.status !== 'Available'}
                          >
                            Rent Now
                          </Button>
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAccounts.map(account => (
            <div
              key={account.id}
              className="bg-white dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewAccountDetails()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={getGameIcon(account.game) || '/placeholder.svg'}
                      alt={account.game === 'lol' ? 'League of Legends' : 'Valorant'}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">{account.id}</span>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      account.status === 'Available'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : account.status === 'Rented'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {account.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <img src={getTierIcon(account.tier) || '/placeholder.svg'} alt={account.tier} className="w-5 h-5" />
                  <div>
                    <p className={`text-sm font-medium ${getRankColor(account.tier)}`}>
                      {account.tier}
                      {' '}
                      {account.rank}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <img
                        src={getRegionIcon(account.region) || '/placeholder.svg'}
                        alt={account.region}
                        className="w-4 h-4"
                      />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{account.region}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {account.game === 'lol' && (
                    <div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Champions</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.champions}</p>
                    </div>
                  )}
                  <div className={account.game === 'valorant' ? 'col-span-2' : ''}>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Skins</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.skins}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getCompanyIcon(account.company) || '/placeholder.svg'}
                      alt={account.company}
                      className="w-4 h-4 rounded-md"
                    />
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{account.company}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    {account.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex border-t border-zinc-100 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
                {account.isRentedByUser
                  ? (
                      <>
                        <Button
                          variant="ghost"
                          className="flex-1 rounded-none text-xs h-10 text-zinc-600 dark:text-zinc-400"
                          onClick={() => handleLoginToAccount(account.id, account.game)}
                        >
                          <LogIn className="h-4 w-4 mr-1" />
                          Login
                        </Button>
                        <div className="w-px bg-zinc-100 dark:bg-zinc-800" />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="flex-1 rounded-none text-xs h-10 text-zinc-600 dark:text-zinc-400"
                            >
                              <ArrowDownToLine className="h-4 w-4 mr-1" />
                              Drop
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Drop Account & Refund</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to drop this account? You will be refunded
                                {' '}
                                {account.refundableAmount}
                                {' '}
                                coins.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300">
                              <p>
                                This action cannot be undone. The account will be immediately returned to the available
                                pool.
                              </p>
                            </div>
                            <DialogFooter className="flex gap-3 sm:justify-end">
                              <Button variant="outline">Cancel</Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDropAccount(account.id)}
                                className="flex items-center gap-1"
                              >
                                <ArrowDownToLine className="h-4 w-4" />
                                Drop & Refund
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )
                  : (
                      <>
                        <Button
                          variant="ghost"
                          className="flex-1 rounded-none text-xs h-10 text-zinc-600 dark:text-zinc-400"
                          onClick={handleViewAccountDetails}
                        >
                          View Details
                        </Button>
                        <div className="w-px bg-zinc-100 dark:bg-zinc-800" />
                        <Button
                          variant="ghost"
                          className="flex-1 rounded-none text-xs h-10 text-zinc-600 dark:text-zinc-400"
                          disabled={account.status !== 'Available'}
                        >
                          Rent Now
                        </Button>
                      </>
                    )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop Account Dialog */}
      <Dialog open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Account & Refund</DialogTitle>
            <DialogDescription>
              {accountToDropId && <>Are you sure you want to drop this account? You will be refunded coins.</>}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300">
            <p>This action cannot be undone. The account will be immediately returned to the available pool.</p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDropDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => accountToDropId && handleDropAccount(accountToDropId)}
              className="flex items-center gap-1"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Drop & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
