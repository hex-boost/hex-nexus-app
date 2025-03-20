import { COMPANIES, LOL_TIERS, RANKS, REGIONS, VALORANT_TIERS } from '@/components/accountsMock';
import { CoinIcon } from '@/components/coin-icon';
import { AccountGameIcon } from '@/components/GameComponents';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useAccounts } from '@/hooks/useAccounts.tsx';
import { useAllDataDragon } from '@/hooks/useDataDragon.ts';
import { usePrice } from '@/hooks/usePrice.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import {
  Check,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { useState } from 'react';

// Helper function to get company icon
export const Route = createFileRoute('/_protected/accounts/')({
  component: Accounts,
});

function Accounts() {
  const { isLoading: isAccountLoading, accounts, filteredAccounts, filters, setFilters, showFilters, setShowFilters, searchQuery, setSearchQuery, requestSort, resetFilters, SortIndicator, handleViewAccountDetails, getRankColor, getEloIcon, getRegionIcon } = useAccounts();

  const { getCompanyIcon } = useMapping();
  const [loadDragonData, setLoadDragonData] = useState(false);

  const { allChampions, allSkins, isLoading: isDataDragonLoading } = useAllDataDragon(loadDragonData);
  const [selectedChampionIds, setSelectedChampionIds] = useState<string[]>([]);
  const [selectedSkinIds, setSelectedSkinIds] = useState<string[]>([]);
  const { price, isPriceLoading } = usePrice();
  const isLoading = isPriceLoading || isAccountLoading;
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if ((accounts && accounts.length === 0) || !accounts) {
    return <div>No accounts found.</div>;
  }
  return (
    <>
      <h1 className="text-4xl font-semibold pb-6 pt-12">Accounts Available</h1>

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
              className={cn('flex items-center gap-1', showFilters && 'bg-zinc-100 dark:bg-card-darker')}
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
          <div className="bg-white dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Game, Tier and Rank */}
              <div className="space-y-4">

                <div>
                  <Label htmlFor="tier" className="text-sm font-medium mb-1.5 block">
                    Rank
                  </Label>
                  <Select value={filters.division} onValueChange={value => setFilters({ ...filters, division: value })}>
                    <SelectTrigger champion="tier" className="w-full">
                      <SelectValue placeholder="Any rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any rank</SelectItem>
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
                    <SelectTrigger champion="rank" className="w-full">
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
                    Server
                  </Label>
                  <Select defaultValue="any" value={filters.region} onValueChange={value => setFilters({ ...filters, region: value })}>
                    <SelectTrigger champion="region" className="w-full">
                      <SelectValue placeholder="Any Server" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="flex items-center" value="any">
                        <div className="w-6 flex items-center justify-center h-6">{getRegionIcon('any')}</div>
                        <span>
                          Any region
                        </span>
                      </SelectItem>
                      {REGIONS.map(region => (
                        <SelectItem className="flex items-center" key={region} value={region}>

                          <div className="w-6 h-6 flex items-center justify-center ">{getRegionIcon(region as any)}</div>
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
                      value: champion.champion,
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
                        {selectedValues.map((champion) => {
                          const champion = allChampions.find(c => c.champion === champion);
                          return (
                            <Avatar key={champion} className="h-6 w-6 border-2 border-background">
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
                            <Avatar key={champion} className="h-6 w-6 border-2 border-background">
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
                            <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5">
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
        <div className="overflow-x-auto rounded-lg border  ">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-50  dark:bg-black/20">
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
                  onClick={() => requestSort('LCUchampions')}
                >
                  <div className="flex relative items-center">
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
                const ranking = account.rankings.find(ranking => ranking.queueType === 'soloqueue')!;

                return (
                  <tr
                    key={account.champion}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer"
                    onClick={() => handleViewAccountDetails(account.documentId)}
                  >
                    <td className="p-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.documentId.slice(0, 6).toUpperCase()}</td>

                    <td className="p-3">
                      <AccountGameIcon game="lol" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img className="w-6 h-6" alt={ranking.elo} src={getEloIcon(ranking.elo)} />
                        <span className={`text-sm capitalize font-medium ${getRankColor(ranking?.elo)}`}>
                          {' '}
                          {ranking?.division || ranking.division}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6">{getRegionIcon(account.server)}</div>
                        {/* <img */}
                        {/*  src={getRegionIcon(account.server) || '/placeholder.svg'} */}
                        {/*  alt={account.server} */}
                        {/*  className="w-5 h-5" */}
                        {/* /> */}
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{account.server.slice(0, account.server.length - 1)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {account.LCUchampions.length}
                    </td>
                    <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">{account.LCUskins.length}</td>
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
                        {account.user ? 'Rented' : 'Available'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        {isPriceLoading

                          ? (
                              <Skeleton className="h-4 w-16" />
                            )
                          : price?.league[ranking.elo.charAt(0).toUpperCase() + ranking.elo.slice(1).toLowerCase()]}
                        {' '}
                        <span className="text-[10px] text-muted-foreground">/1h</span>
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
                          <DropdownMenuItem onClick={() => handleViewAccountDetails(account.documentId)}>
                            View
                            Details
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem>Rent Account</DropdownMenuItem> */}
                          {/* <DropdownMenuItem>Add to Favorites</DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
