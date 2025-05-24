import type { Rank } from '@/components/RanksRadioGroup.tsx';
import logoBoostRoyal from '@/assets/logo-boost-royal.svg';
import logoHexBoost from '@/assets/logo-hex-boost.svg';
import logoTurboBoost from '@/assets/logo-turbo-boost.png';
import { DivisionsMultiSelect, RanksMultiSelect } from '@/components/RanksRadioGroup.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';

import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { AccountsTable } from '@/features/accounts-table/components/accounts-table.tsx';
import { AccountsPagination } from '@/features/accounts-table/components/AccountsPagination.tsx';
import { FilterButton } from '@/features/accounts-table/components/filter-button.tsx';
import { ItemsPerPageSelector } from '@/features/accounts-table/components/items-per-page-selector.tsx';
import { ResultsCount } from '@/features/accounts-table/components/results-count.tsx';
import { SearchBar } from '@/features/accounts-table/components/search-query.tsx';
import { useAccounts } from '@/features/accounts-table/hooks/useAccounts.tsx';
import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { usePrice } from '@/hooks/usePrice.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { AlertCircle, AlertOctagon, AlertTriangle, Check, Shield, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AccountsTablePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useUserStore();
  const {
    isLoading,
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
    setPageSize,

    getRegionIcon,
    availableRegions,
    setSelectedSkinIds,
    setSelectedChampionIds,
    selectedChampionIds,
    selectedSkinIds,
    handlePageChange,
    totalPages,
    totalItems,
    sortConfig,
    pagination,
    sliderValue,
    handleBlueEssenceChange,
  } = useAccounts(currentPage);

  const { getCompanyIcon, getFormattedServer } = useMapping();
  const { allChampions, allSkins, isLoading: isDataDragonLoading } = useAllDataDragon();
  const { price, isPriceLoading } = usePrice();

  // Reset to first page when filters change
  // @ts-ignore
  useEffect(() => {
    // @ts-ignore
    setCurrentPage(1);
    handlePageChange(1); // Add this to sync the hook's pagination state
    // @ts-ignore
  }, [filters, searchQuery, sortConfig]); // Updated page change handler that triggers the API fetch
  const onPageChange = (page: number) => {
    setCurrentPage(page);
    handlePageChange(page);
  };

  return (
    <>
      <h1 className="text-3xl font-semibold pb-6 ">Accounts Available</h1>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <div className="flex gap-4">
            {showFilters && (
              <Button variant="outline" size="sm" className="" onClick={resetFilters}>
                <XIcon className="mr-1" size={16}></XIcon>
                Reset Filters
              </Button>
            )}
            <FilterButton showFilters={showFilters} setShowFilters={setShowFilters} />
          </div>
        </div>

        {showFilters && (

          <div
            className="bg-white dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="grid gap-4 ">
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">

                    <Label className="text-sm font-medium mb-1.5 block">
                      Rank
                    </Label>
                    {filters.ranks.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ ...filters, ranks: [] })}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <RanksMultiSelect
                    defaultSelected={filters.ranks as Rank[]} // Cast to satisfy type requirements
                    onChange={(selectedRanks) => {
                      setFilters({ ...filters, ranks: selectedRanks });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">

                    <Label className="text-sm font-medium mb-1.5 block">
                      Division
                    </Label>
                    {filters.divisions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ ...filters, divisions: [] })}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <DivisionsMultiSelect
                    defaultSelected={filters.divisions as any[]} // Cast to satisfy type requirements
                    onChange={(selectedDivisions) => {
                      setFilters({ ...filters, divisions: selectedDivisions });
                    }}
                    disabled={filters.ranks.length === 1 && filters.ranks[0] === 'master'}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium pb-1 block">
                    Queue Type
                  </Label>
                  <div className="flex justify-between space-x-2 w-full ">
                    <RadioGroup
                      value={filters.queueType || 'soloqueue'}
                      onValueChange={value => setFilters({ ...filters, queueType: value })}
                      className="flex w-full space-x-4"
                    >
                      <div className="flex w-full items-center space-x-2">
                        <RadioGroupItem value="soloqueue" id="soloqueue" className="peer" />
                        <Label
                          htmlFor="soloqueue"
                          className="cursor-pointer peer-data-[state=checked]:text-primary"
                        >
                          Solo Queue
                        </Label>
                      </div>
                      <div className="flex w-full items-center space-x-2">
                        <RadioGroupItem value="flex" id="flexqueue" className="peer" />
                        <Label
                          htmlFor="flexqueue"
                          className="cursor-pointer peer-data-[state=checked]:text-primary"
                        >
                          Flex Queue
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              <div className="flex h-full flex-col gap-4">

                <div className="space-y-2">
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
                    onChange={(values) => {
                      setFilters({ ...filters, selectedChampions: values });

                      setSelectedChampionIds(values);
                    }}
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
                      .filter(skin => skin.name !== 'default')
                      .map(skin => ({
                        label: skin.name,
                        value: skin.id.toString(),
                        avatar: skin.imageAvatarUrl,
                      }))}
                    value={selectedSkinIds}
                    isLoading={isDataDragonLoading}
                    onChange={(values) => {
                      setSelectedSkinIds(values);
                      setFilters({ ...filters, selectedSkins: values });
                    }}
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
                    // For Skins section - fix the renderSelectedItem function
                    renderSelectedItem={selectedValues => (
                      <div className="flex -space-x-2">
                        {selectedValues.map((skinId) => {
                          // Fix the lookup logic to find skins by their ID, not by champion
                          const skin = allSkins.find(s => s.id.toString() === skinId);
                          return (
                            <Avatar
                              key={skinId}
                              className="h-6 w-6 border-2 border-background"
                            >
                              <AvatarImage
                                src={skin?.imageAvatarUrl} // Make sure this matches the property used in the options
                                alt={skin?.name}
                                className="object-cover object-top scale-150"
                              />
                              <AvatarFallback>{skin?.name?.[0] || 'S'}</AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                <div>

                  <div className="flex justify-between items-center mb-1">

                    <Label className="text-sm font-medium mb-1.5 block">
                      Server
                    </Label>
                    {filters.region !== '' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ ...filters, region: '' })}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear server
                      </Button>
                    )}
                  </div>
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
                          Any Server
                        </span>
                      </SelectItem>
                      {availableRegions.map(region => (
                        <SelectItem className="flex items-center" key={region} value={region}>
                          <div className="w-6 h-6 flex items-center justify-center">
                            {getRegionIcon(region)}
                          </div>
                          <span className="text-sm">
                            {getFormattedServer(region)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-sm font-medium mb-1.5 block">
                      Company
                    </Label>
                    {filters.company !== '' && user?.accountPermissions && user?.accountPermissions?.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ ...filters, company: '' })}
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <RadioGroup
                    disabled={!user?.accountPermissions || user?.accountPermissions?.length < 2}
                    value={filters.company}
                    onValueChange={value => setFilters({ ...filters, company: value })}
                    className="flex space-x-2"
                  >
                    { user?.accountPermissions?.some(permission => permission === 'private') && (
                      <div className="flex justify-center items-center w-full ">
                        <RadioGroupItem value="private" id="private" className="peer" />
                        <Label
                          htmlFor="private"
                          className="flex justify-center items-center gap-2 cursor-pointer peer-data-[state=checked]:text-primary"
                        >
                          <img src={logoHexBoost} alt="Nexus" className="ml-2 w-6 h-6" />
                          <span className="min-w-fit">Private</span>
                        </Label>
                      </div>
                    )}

                    <div className="flex justify-center items-center w-full ">
                      <RadioGroupItem value="nexus" id="nexus" className="peer" />
                      <Label
                        htmlFor="nexus"
                        className="flex justify-center items-center gap-2 cursor-pointer peer-data-[state=checked]:text-primary"
                      >
                        <img src={logoHexBoost} alt="Nexus" className="ml-2 w-6 h-6" />
                        <span className="min-w-fit">Nexus</span>
                      </Label>
                    </div>

                    <div className="flex justify-center w-full items-center ">
                      <RadioGroupItem value="boostroyal" id="boostroyal" className="peer" />
                      <Label
                        htmlFor="boostroyal"
                        className="flex justify-center items-center gap-2 cursor-pointer peer-data-[state=checked]:text-primary"
                      >
                        <img src={logoBoostRoyal} alt="BoostRoyal" className="ml-2 w-6 h-6" />
                        <span className="min-w-fit">Boost Royal</span>
                      </Label>
                    </div>
                    <div className="flex  justify-center w-full items-center ">
                      <RadioGroupItem value="turboboost" id="turboboost" className="peer " />
                      <Label
                        htmlFor="turboboost"
                        className="flex justify-center items-center gap-2 cursor-pointer peer-data-[state=checked]:text-primary"
                      >
                        <img src={logoTurboBoost} alt="Turbo Boost" className="w-6 h-6 ml-2" />
                        <span className="min-w-fit">Turbo Boost</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="space-y-4 flex flex-col h-full">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Account Restrictions</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        value: 'none',
                        label: 'None',
                        icon: Shield,
                        className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                      },
                      {
                        value: 'low',
                        label: 'Low',
                        icon: AlertCircle,
                        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                      },
                      {
                        value: 'medium',
                        label: 'Medium',
                        icon: AlertTriangle,
                        className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                      },
                      {
                        value: 'high',
                        label: 'High',
                        icon: AlertOctagon,
                        className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
                      },
                    ].map((status) => {
                      const Icon = status.icon;
                      const isSelected = filters.leaverStatus?.includes(status.value);

                      return (
                        <div key={status.value} className="w-full min-h-[40px] flex">
                          <Badge

                            key={status.value}
                            variant="outline"
                            className={cn(
                              status.className,
                              'cursor-pointer w-full h-full transition-all',
                              isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : '',
                            )}
                            onClick={() => {
                              const currentStatuses = filters.leaverStatus || [];
                              const newStatuses = isSelected
                                ? currentStatuses.filter(s => s !== status.value)
                                : [...currentStatuses, status.value];

                              setFilters({
                                ...filters,
                                leaverStatus: newStatuses,
                              });
                            }}
                          >
                            <Icon className="h-6 w-6 mr-1" />
                            <span className="">{status.label}</span>
                            {isSelected && (
                              <Check className="ml-1 h-3 w-3" />
                            )}
                          </Badge>
                        </div>
                      );
                    })}

                  </div>
                </div>
                <div className="w-full">
                  <Label className="text-sm font-medium mb-1.5 block">
                    Blue Essence (
                    {sliderValue.toLocaleString() || '0'}
                    )
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[450, 1350, 3150, 4444, 4800, 6300, 7800].map(value => (
                      <Button
                        key={value}
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-7 px-2  text-xs min-w-fit',
                          filters.minBlueEssence === value ? 'border   cursor-pointer transition-all border-blue-500 dark:bg-blue-900/20 ' : '',
                        )}
                        onClick={() => setFilters({
                          ...filters,
                          minBlueEssence: value,
                        })}
                      >
                        {value.toLocaleString()}
                        {' '}
                        BE
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setFilters({
                        ...filters,
                        minBlueEssence: 0,
                      })}
                    >
                      Reset
                    </Button>
                  </div>
                  <Slider
                    value={[sliderValue]} // For controlled component
                    onValueChange={value => handleBlueEssenceChange(value[0])}

                    defaultValue={[filters.minBlueEssence]}
                    min={0}
                    max={30000}
                    step={100}
                    className="my-4"
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        <AccountsTable
          filters={filters}
          isLoading={isLoading}
          filteredAccounts={filteredAccounts}
          isPriceLoading={isPriceLoading}
          price={price}
          requestSort={requestSort}
          SortIndicator={SortIndicator}
          handleViewAccountDetails={handleViewAccountDetails}
          getEloIcon={getEloIcon}
          getRegionIcon={getRegionIcon}
          getCompanyIcon={getCompanyIcon as any}
          getRankColor={getRankColor}
        />

        {/* Pagination component */}
        {filteredAccounts.length > 0 && (
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-4">
              <ResultsCount filteredCount={filteredAccounts.length} totalCount={totalItems}>

                <ItemsPerPageSelector
                  pageSize={pagination.pageSize}
                  onPageSizeChange={setPageSize}
                />

              </ResultsCount>
            </div>
            <div className="mt-4">
              <AccountsPagination
                currentPage={pagination.page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
