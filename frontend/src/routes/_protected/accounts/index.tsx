import type { Price } from '@/types/price.ts';
import type { RankingType } from '@/types/types.ts';
import { COMPANIES, DIVISIONS, LOL_TIERS, REGIONS, VALORANT_TIERS } from '@/components/accountsMock.ts';
import { CoinIcon } from '@/components/coin-icon';
import { AccountGameIcon } from '@/components/GameComponents';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useAccounts } from '@/hooks/useAccounts.tsx';
import { useAllDataDragon } from '@/hooks/useDataDragon.ts';
import { usePrice } from '@/hooks/usePrice.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import { Check, ChevronDown, Filter, MoreHorizontal, Search } from 'lucide-react';
import { useState } from 'react';

// Helper function to get company icon
export const Route = createFileRoute('/_protected/accounts/')({
  component: Accounts,
});
// 1. SearchBar component
type SearchBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      <Input
        placeholder="Search by account ID..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="pl-9 h-10"
      />
    </div>
  );
}

// 2. FilterButton component
type FilterButtonProps = {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
};

function FilterButton({ showFilters, setShowFilters }: FilterButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowFilters(!showFilters)}
      className={cn('flex items-center gap-1', showFilters && 'bg-zinc-100 dark:bg-card-darker')}
    >
      <Filter className="h-4 w-4" />
      Filters
      <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'transform rotate-180')} />
    </Button>
  );
}

// 3. ResultsCount component
type ResultsCountProps = {
  filteredCount: number;
  totalCount?: number;
};

function ResultsCount({ filteredCount, totalCount }: ResultsCountProps) {
  return (
    <div className="text-sm text-zinc-600 dark:text-zinc-400">
      Showing
      {' '}
      {filteredCount}
      {' '}
      of
      {' '}
      {totalCount || 0}
      {' '}
      accounts
    </div>
  );
}
// 4. PriceDisplay component
type PriceDisplayProps = {
  isPriceLoading: boolean;
  price: Price;
  ranking: RankingType;
};

function PriceDisplay({ isPriceLoading, price, ranking }: PriceDisplayProps) {
  return (
    <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
      <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
      {isPriceLoading
        ? (
            <Skeleton className="h-5 w-12" />
          )
        : (
            price?.league[ranking.elo.charAt(0).toUpperCase() + ranking.elo.slice(1).toLowerCase()]
          )}
      <span className="text-[10px] text-muted-foreground">/1h</span>
    </div>
  );
}

// 5. AccountActionsMenu component
type AccountActionsMenuProps = {
  accountId: string;
  onViewDetails: (id: string) => void;
};

function AccountActionsMenu({ accountId, onViewDetails }: AccountActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(accountId)}>
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 6. TableHeaderRow component
type TableHeaderProps = {
  requestSort: (column: string) => void;
  SortIndicator: React.FC<{ column: string }>;
};

// 7. AccountRow component - handles display of account data and loading state
type AccountRowProps = {
  account: any;
  isPriceLoading: boolean;
  price: any;
  onViewDetails: (id: string) => void;
  getEloIcon: (elo: string) => string;
  getRegionIcon: (region: string) => React.ReactNode;
  getCompanyIcon: (company: string) => string;
  getRankColor: (elo: string) => string;
};

function AccountRow({
  account,
  isPriceLoading,
  price,
  onViewDetails,
  getEloIcon,
  getRegionIcon,
  getCompanyIcon,
  getRankColor,
}: AccountRowProps) {
  const ranking = account.rankings.find(ranking => ranking.queueType === 'soloqueue')!;

  return (
    <tr
      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer"
      onClick={() => onViewDetails(account.documentId)}
    >
      <td className="p-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {account.documentId.slice(0, 6).toUpperCase()}
      </td>
      <td className="p-3">
        <AccountGameIcon game="lol" />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <img className="w-6 h-6" alt={ranking.elo} src={getEloIcon(ranking.elo)} />
          <span className={`text-sm capitalize font-medium ${getRankColor(ranking?.elo)}`}>
            {ranking?.division || ranking.division}
          </span>
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6">{getRegionIcon(account.server)}</div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {account.server.slice(0, account.server.length - 1)}
          </span>
        </div>
      </td>
      <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
        {account.LCUchampions.length}
      </td>
      <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
        {account.LCUskins.length}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <img
            src={getCompanyIcon(account.type) || '/placeholder.svg'}
            alt={account.type}
            className="w-6 h-6 rounded-md"
          />
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
          {account.user ? 'Rented' : 'Available'}
        </span>
      </td>
      <td className="p-3">
        <PriceDisplay isPriceLoading={isPriceLoading} price={price} ranking={ranking} />
      </td>
      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
        <AccountActionsMenu accountId={account.documentId} onViewDetails={onViewDetails} />
      </td>
    </tr>
  );
}

// 8. AccountTableSkeleton - loading state for accounts table
function AccountTableSkeleton() {
  return (
    <>
      {[...Array.from({ length: 5 })].map((_, index) => (
        <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800">
          <td className="p-3"><Skeleton className="h-5 w-16" /></td>
          <td className="p-3"><Skeleton className="h-6 w-6 rounded-full" /></td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
          </td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-12" />
            </div>
          </td>
          <td className="p-3"><Skeleton className="h-5 w-8" /></td>
          <td className="p-3"><Skeleton className="h-5 w-8" /></td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
          </td>
          <td className="p-3">
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="p-3">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-5 w-12" />
            </div>
          </td>
          <td className="p-3 text-center">
            <Skeleton className="h-8 w-8 rounded-md mx-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

// 9. AccountsTable - table component with header and rows
type AccountsTableProps = {
  isLoading: boolean;
  filteredAccounts: any[];
  isPriceLoading: boolean;
  price: any;
  requestSort: (column: string) => void;
  SortIndicator: React.FC<{ column: string }>;
  handleViewAccountDetails: (id: string) => void;
  getEloIcon: (elo: string) => string;
  getRegionIcon: (region: string) => React.ReactNode;
  getCompanyIcon: (company: string) => string;
  getRankColor: (elo: string) => string;
};

function AccountsTable({
  isLoading,
  filteredAccounts,
  isPriceLoading,
  price,
  requestSort,
  SortIndicator,
  handleViewAccountDetails,
  getEloIcon,
  getRegionIcon,
  getCompanyIcon,
  getRankColor,
}: AccountsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-black/20">
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">ID</th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Game</th>
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
              onClick={() => requestSort('coin_price')}
            >
              <div className="flex relative items-center">
                Price
                <SortIndicator column="coin_price" />
              </div>
            </th>
            <th className="text-left p-3 text-xs font-medium text-zinc-600 dark:text-zinc-400"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? (
                <AccountTableSkeleton />
              )
            : (
                filteredAccounts.map(account => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    isPriceLoading={isPriceLoading}
                    price={price}
                    onViewDetails={handleViewAccountDetails}
                    getEloIcon={getEloIcon}
                    getRegionIcon={getRegionIcon}
                    getCompanyIcon={getCompanyIcon}
                    getRankColor={getRankColor}
                  />
                ))
              )}
        </tbody>
      </table>
    </div>
  );
}
function Accounts() {
  const {
    isLoading,
    accounts,
    filteredAccounts,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    searchQuery,
    setSearchQuery,
    requestSort,
    resetFilters,
    SortIndicator,
    handleViewAccountDetails,
    getRankColor,
    getEloIcon,
    getRegionIcon,
  } = useAccounts();

  const { getCompanyIcon } = useMapping();
  const [loadDragonData, setLoadDragonData] = useState(false);

  const { allChampions, allSkins, isLoading: isDataDragonLoading } = useAllDataDragon(loadDragonData);
  const [selectedChampionIds, setSelectedChampionIds] = useState<string[]>([]);
  const [selectedSkinIds, setSelectedSkinIds] = useState<string[]>([]);
  const { price, isPriceLoading } = usePrice();

  return (
    <>
      <h1 className="text-3xl font-semibold pb-6 ">Accounts Available</h1>

      <div className="space-y-6">
        {/* Header with search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <FilterButton showFilters={showFilters} setShowFilters={setShowFilters} />
        </div>

        {/* Filters section */}
        {showFilters && (
          <div
            className="bg-white dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Game, Tier and Rank */}
              <div className="space-y-4">

                <div>
                  <Label htmlFor="tier" className="text-sm font-medium mb-1.5 block">
                    Rank
                  </Label>
                  <Select
                    value={filters.rank}
                    onValueChange={value => setFilters({ ...filters, rank: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any rank</SelectItem>
                      {(filters.game === 'Valorant' ? VALORANT_TIERS : LOL_TIERS).map(rank => (
                        <SelectItem key={rank} value={rank}>
                          {rank}
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
                    value={filters.division}
                    onValueChange={value => setFilters({ ...filters, division: value })}
                    disabled={['Master', 'Grandmaster', 'Challenger', 'Radiant'].includes(filters.division)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any division</SelectItem>
                      {DIVISIONS.map(division => (
                        <SelectItem key={division} value={division}>
                          {division}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region" className="text-sm font-medium mb-1.5 block">
                    Server
                  </Label>
                  <Select
                    defaultValue="any"
                    value={filters.region}
                    onValueChange={value => setFilters({ ...filters, region: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any Server" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="flex items-center" value="any">
                        <div
                          className="w-6 flex items-center justify-center h-6"
                        >
                          {getRegionIcon('any')}
                        </div>
                        <span>
                          Any region
                        </span>
                      </SelectItem>
                      {REGIONS.map(region => (
                        <SelectItem className="flex items-center" key={region} value={region}>

                          <div
                            className="w-6 h-6 flex items-center justify-center "
                          >
                            {getRegionIcon(region as any)}
                          </div>
                          <span className="text-sm">
                            {' '}
                            {region.slice(0, region.length - 1)}
                          </span>
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
                  <MultiSelectCombobox
                    label=" champions"
                    isLoading={isDataDragonLoading}
                    options={allChampions.map(champion => ({
                      label: champion.name,
                      value: champion.id,
                      avatar: champion.imageUrl,
                    }))}
                    value={selectedChampionIds}
                    onChange={setSelectedChampionIds}
                    renderItem={option => (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={option.avatar} />
                          <AvatarFallback>{option.label[0]}</AvatarFallback>
                        </Avatar>
                        {option.label}
                      </div>
                    )}
                    renderSelectedItem={selectedValues => (
                      <div className="flex -space-x-2">
                        {selectedValues.map((value) => {
                          const champion = allChampions.find(c => c.id === value);
                          return (
                            <Avatar
                              key={champion!.id}
                              className="h-6 w-6 border-2 border-background"
                            >
                              <AvatarImage src={champion?.imageUrl} />
                              <AvatarFallback>{champion?.name?.[0] || 'C'}</AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Specific Skins</Label>
                  <MultiSelectCombobox
                    label=" skins"
                    options={allSkins
                      .filter(skin => skin.name !== 'default') // Remove default skins
                      .map(skin => ({
                        label: skin.name,
                        value: skin.champion.toString(),
                        avatar: skin.imageAvatarUrl,
                      }))}
                    value={selectedSkinIds}
                    onOpenChange={(open) => {
                      if (open) {
                        setLoadDragonData(true);
                      }
                    }}
                    isLoading={isDataDragonLoading}
                    onChange={setSelectedSkinIds}
                    renderItem={option => (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={option.avatar}
                            alt={option.label}
                            className="object-cover object-top scale-150"
                          />
                          <AvatarFallback>{option.label[0]}</AvatarFallback>
                        </Avatar>
                        {option.label}
                      </div>
                    )}
                    renderSelectedItem={selectedValues => (
                      <div className="flex -space-x-2">
                        {selectedValues.map((champion) => {
                          // Use skin data instead of champion data
                          const skin = allSkins.find(s => s.champion.toString() === champion);
                          return (
                            <Avatar
                              key={champion}
                              className="h-6 w-6 border-2 border-background"
                            >
                              <AvatarImage src={skin?.imageAvatarUrl} alt={skin?.name} />
                              <AvatarFallback>{skin?.name?.[0] || 'S'}</AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Company and Status */}
              <div className="space-y-6 flex flex-col justify-between h-full">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Company</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {COMPANIES.map(company => (
                      <div
                        key={company}
                        className={cn(
                          'flex relative flex-col items-center justify-center py-4 rounded-lg border cursor-pointer transition-all',
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
                        <div className=" mb-2">
                          <img
                            src={getCompanyIcon(company)}
                            alt={company}
                            className="w-8 h-8 rounded-md"
                          />
                          {filters.company === company && (
                            <div
                              className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-center">{company}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="lg" className="" onClick={resetFilters}>
                  Reset All Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <ResultsCount filteredCount={filteredAccounts.length} totalCount={accounts?.length} />

        {/* Table View */}
        <AccountsTable
          isLoading={isLoading}
          filteredAccounts={filteredAccounts}
          isPriceLoading={isPriceLoading}
          price={price}
          requestSort={requestSort}
          SortIndicator={SortIndicator}
          handleViewAccountDetails={handleViewAccountDetails}
          getEloIcon={getEloIcon}
          getRegionIcon={getRegionIcon}
          getCompanyIcon={getCompanyIcon}
          getRankColor={getRankColor}
        />
      </div>
    </>
  );
}
