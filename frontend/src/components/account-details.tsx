import type { Price } from '@/types/price.ts';
import type { AccountType } from '@/types/types.ts';
import { ChampionsSkinsTab } from '@/components/ChampionsSkinsTab.tsx';
import { CoinIcon } from '@/components/coin-icon.tsx';

import { RentedAccountButton } from '@/components/RentedAccountAction.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useAccountActions } from '@/hooks/useAccountActions.ts';
import { useAccountFilters } from '@/hooks/useAccountFilters.ts';
import { getLeaverBusterInfo } from '@/hooks/useAccounts.tsx';
import { useDateTime } from '@/hooks/useDateTime.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowDownToLine,
  Check,
  CircleCheckBig,
  Clock,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { useState } from 'react';
import AccountInfoDisplay from './account-info-display';

function LeaverBusterDisplay({ account, compact = false }: {
  account: AccountType;
  compact?: boolean;
}) {
  const leaverInfo = getLeaverBusterInfo(account);

  // Define styling based on severity
  const getStatusConfig = () => {
    if (!leaverInfo || !leaverInfo.hasRestriction) {
      return {
        Icon: Shield,
        color: 'bg-emerald-100 border border-emerald-900 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        label: 'No restrictions',
        description: 'This account has no active restrictions',
      };
    }

    if (leaverInfo.severity >= 3) {
      return {
        Icon: AlertOctagon,
        color: 'bg-red-100 dark:bg-red-900/30 border border-red-900 text-red-600 dark:text-red-400',
        label: 'High',
        description: leaverInfo.message,
      };
    }

    if (leaverInfo.severity >= 1) {
      return {
        Icon: AlertTriangle,
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-900 dark:text-amber-400',
        label: 'Medium',
        description: leaverInfo.message,
      };
    }

    return {
      Icon: AlertCircle,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-900 dark:text-blue-400',
      label: 'Low',
      description: leaverInfo.message,
    };
  };

  const statusConfig = getStatusConfig();
  const LeaverIcon = statusConfig.Icon;

  return (
    <div className={cn('flex items-center gap-2 p-4 rounded-md', statusConfig.color)}>
      <LeaverIcon className="h-8 w-8" />
      <span className="text-base">
        {compact ? statusConfig.label : statusConfig.description}
      </span>
    </div>
  );
}
export default function AccountDetails({ account, price, onAccountChange }: {
  onAccountChange: () => Promise<void>;
  price: Price;
  account: AccountType;
}) {
  const { user } = useUserStore();
  const { championsSearch, setChampionsSearch, skinsSearch, setSkinsSearch, filteredChampions, filteredSkins } = useAccountFilters({ account });
  const { selectedRentalOptionIndex, handleExtendAccount, isExtendPending, setSelectedRentalOptionIndex, selectedExtensionIndex, handleDropAccount, isRentPending, isDropPending, setIsDropDialogOpen, handleRentAccount, isDropDialogOpen } = useAccountActions({ account, onAccountChange });
  const [activeTab, setActiveTab] = useState(0);
  const { getCompanyIcon, getGameIcon } = useMapping();
  const hours = [1, 3, 6];
  const soloQueueRank = account.rankings?.find(lc => lc.queueType === 'soloqueue');
  const flexQueueRank = account.rankings?.find(lc => lc.queueType === 'flex');
  const { calculateTimeRemaining } = useDateTime();
  const baseElo = soloQueueRank?.elo || 'Unranked';
  const baseEloUpperCase = baseElo.charAt(0).toUpperCase() + baseElo.slice(1).toLowerCase();
  const basePrice = price.league[baseEloUpperCase] || 105; // Default to Unranked price instead of 666

  // Map the hours correctly to the multipliers
  const rentalOptionsWithPrice = price.timeMultipliers.map((percentage, index) => ({
    hours: hours[index], // Use the predefined hours array
    price: percentage === 0 ? basePrice : basePrice * (1 + percentage / 100),
  }));
  const {
    data: dropRefund,
  } = useQuery({
    queryKey: ['accounts', 'refund', account.id],
    queryFn: () => strapiClient.find<{ amount: number }>(`accounts/${account?.documentId}/refund`).then(res => res.data),
    enabled: account.user?.documentId === user?.documentId,
    staleTime: 0,
  });
  return (
    <>
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader className="border-none justify-center">
            <CardTitle className="flex border-none items-center justify-between">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getGameIcon('lol', { size: 48 })}
                  <div className="flex flex-col gap-1">
                    <span>
                      {account.documentId.slice(0, 10)}
                    </span>
                    {
                      account.gamename

                        ? <span className="text-sm text-muted-foreground   transition-all duration-200">{`${account.gamename}#${account.tagline}`}</span>
                        : <span className="text-sm text-muted-foreground blur-[2px] select-none transition-all duration-200">Summoner Name</span>
                    }
                  </div>
                </div>
              </div>

              <div className="flex text-lg lc capitalize items-center gap-2">
                <img
                  src={getCompanyIcon(account.type)}
                  alt={account.type}
                  className="w-8 h-8"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 ">
            <AccountInfoDisplay
              accountId={account.documentId}
              game="lol"
              status={account.user ? 'Rented' : 'Available'}
              leaverBusterStatus="None"
              soloQueueRank={soloQueueRank}
              flexQueueRank={flexQueueRank}

            />

            <LeaverBusterDisplay account={account} />
            <div className="grid grid-cols-2  md:grid-cols-3 gap-4">
              <div className="border p-3 dark:bg-white/[0.01] rounded-lg">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Champions</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{account.LCUchampions.length}</p>
              </div>

              <div className="border p-3 dark:bg-white/[0.01] rounded-lg">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Skins</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{account.LCUskins.length}</p>
              </div>

              <div className="border p-3 dark:bg-white/[0.01] rounded-lg">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Server</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{account.server.slice(0, account.server.length - 1)}</p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-300/20 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="w-10 h-10 ">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img
                    src="https://raw.communitydragon.org/15.2/plugins/rcp-fe-lol-collections/global/default/images/skins-viewer/currencies/icon-blue-essence.png"
                  />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Blue Essence</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {account.blueEssence || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-orange-50 dark:bg-yellow-900/20 border border-yellow-300/20 p-3 rounded-lg">
                <div className="w-10 h-10">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/icon-rp-72.png" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Riot Points</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {account.riotPoints || 0}
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="w-full bg-card p-6 min-h-[50vh] border rounded-lg">
          <ChampionsSkinsTab
            tabLabel={[`Champions (${account?.LCUchampions?.length})`, `Skins (${account?.LCUskins?.length})`]}
            activeTab={activeTab}
            onTabChangeAction={setActiveTab}
            tabs={['Champions', 'Skins']}
          />

          {activeTab === 0 && (
            <div className="space-y-4 ">
              <div className="relative ">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400"
                />
                <Input
                  placeholder="Search champions..."
                  value={championsSearch}
                  onChange={e => setChampionsSearch(e.target.value)}
                  className="pl-9 !bg-transparent "
                />
                {championsSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setChampionsSearch('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-7  md:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 overflow-y-auto overflow-x-hidden max-h-[60vh] ">
                {filteredChampions.map(champion => (
                  <div
                    key={champion?.id}
                    className="scale-110 rounded-md overflow-hidden flex flex-col items-center"
                  >
                    <img
                      src={champion?.imageUrl}
                      alt={champion?.name}
                      className="w-full h-auto object-cover"
                      style={{ height: '50px', width: '50px' }}
                    />
                    <div className="p-1 text-center w-full">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate w-full">
                        {champion?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredChampions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No champions found matching "
                    {championsSearch}
                    "
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400"
                />
                <Input
                  placeholder="Search skins or champions..."
                  value={skinsSearch}
                  onChange={e => setSkinsSearch(e.target.value)}
                  className="pl-9 !bg-transparent "
                />
                {skinsSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSkinsSearch('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto max-h-[60vh]">
                {filteredSkins.map(skin => (
                  <div
                    key={skin.id}
                    className="bg-zinc-50 dark:bg-background rounded-md "
                  >
                    <div className="relative">
                      <img
                        src={skin.imageUrl}
                        alt={skin.name}
                        className="w-full rounded-tl-md rounded-tr-md h-auto object-cover"
                      />
                      {/* <Badge */}
                      {/*  className={cn('absolute z-[10] -top-2 -right-2 text-[10px] px-1 py-0 blur-[0.04px]  ', skin.rarity)} */}
                      {/* > */}
                      {/*  {skin.rarity} */}
                      {/* </Badge> */}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate">{skin.name}</p>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400">{skin.champion}</p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSkins.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No skins found matching "
                    {skinsSearch}
                    "
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right column - Rental options */}
      <div className="space-y-6 col-span-2">
        {account.user && account.user.id === user!.id
          ? (

              <Card>
                <CardHeader>
                  <CardTitle>Rented Account</CardTitle>
                  <CardDescription>This account is currently rented by you</CardDescription>
                </CardHeader>
                <Separator className="mb-4" />
                <CardContent className="space-y-4 p-0">
                  <div className=" border-white/10  rounded-md px-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400 text-sm flex items-center gap-1">
                        Remaining time:
                      </span>

                      <span className="font-medium">
                        {calculateTimeRemaining(account)}

                      </span>
                    </div>
                  </div>

                  <div className=" border-white/10 rounded-md px-6">
                    <div className="flex justify-between items-center ">
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1 text-sm">Refundable amount:</span>
                      <div
                        className="flex text-sm items-center gap-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50 "
                      >
                        <CoinIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        {dropRefund
                          ? <>{dropRefund.amount.toLocaleString()}</>
                          : <Skeleton className="w-6 h-4"></Skeleton>}
                        {' '}
                        coins
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="px-6 mb-6">
                    <div className="text-sm mb-2 text-zinc-600 dark:text-zinc-400">Quick extend options</div>
                    <div className="grid grid-cols-3 gap-2">
                      {price.timeMultipliers.map((_option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="flex border-primary/10 bg-white/[0.001] flex-col items-center gap-1 h-auto py-2"
                          onClick={() => handleExtendAccount(index)}
                          loading={isExtendPending && selectedExtensionIndex === index}
                          disabled={isExtendPending}
                        >
                          <span className="text-sm">
                            {hours[index]}
                            h
                          </span>
                          <div className="flex items-center gap-0.5 text-xs">
                            <CoinIcon className="w-3 h-3 text-amber-500" />
                            {rentalOptionsWithPrice[index]?.price.toLocaleString() || 0}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">

                  <RentedAccountButton account={account} />

                  <Dialog defaultOpen={false} open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-1">
                        <ArrowDownToLine className="h-4 w-4" />
                        Drop Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Drop Account </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to drop this account?
                          <br />
                          {' '}
                          You will be refunded
                          {' '}
                          <span className="text-blue-300">{dropRefund?.amount.toLocaleString()}</span>
                          {' '}
                          coins.
                        </DialogDescription>
                      </DialogHeader>
                      <div
                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300"
                      >
                        <p>
                          This action cannot be undone. The account will be immediately returned to
                          the available pool.
                        </p>
                      </div>
                      <DialogFooter className="flex gap-3 sm:justify-end">
                        <Button variant="outline" onClick={() => setIsDropDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          loading={isDropPending}

                          disabled={isDropPending || account.user?.documentId !== user?.documentId}
                          onClick={() => handleDropAccount()}
                          className="flex items-center gap-1"
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                          Confirm
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            )
          : (
              <Card>
                <CardHeader>
                  <CardTitle>Rent This Account</CardTitle>
                  <CardDescription>Choose your preferred rental duration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {price.timeMultipliers.map((option, index) => (
                      // eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events
                      <div
                        key={index}
                        className={cn('border  rounded-lg p-3 cursor-pointer transition-all', selectedRentalOptionIndex === index ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700')}
                        onClick={() => setSelectedRentalOptionIndex(index)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              {hours[index]}
                              {' '}
                              {option === 0 ? 'hour' : 'hours'}
                            </span>
                          </div>
                          {selectedRentalOptionIndex === index && (
                            <div className="bg-blue-500 rounded-full p-0.5">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-50"
                        >
                          <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          {rentalOptionsWithPrice[index]?.price.toLocaleString() || 0}
                          {' '}
                          coins
                        </div>
                        {option === 24 && (
                          <Badge
                            variant="outline"
                            className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/20"
                          >
                            Best Value
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Price</span>
                      <div
                        className="flex items-center gap-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                      >
                        <CoinIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        {(() => {
                          const selectedOption = rentalOptionsWithPrice[selectedRentalOptionIndex];
                          return selectedOption ? selectedOption.price.toLocaleString() : '0';
                        })()}
                        {' '}
                        coins
                      </div>
                    </div>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!rentalOptionsWithPrice[selectedRentalOptionIndex] || isRentPending}
                      loading={isRentPending}
                      onClick={() => handleRentAccount(selectedRentalOptionIndex)}
                    >
                      Rent Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-white/[0.01] rounded-lg">
              <CircleCheckBig className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Verified Account</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  This account has been verified
                  by our team
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-white/[0.01] rounded-lg">
              <CircleCheckBig className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Secure Rental</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Your rental is protected by our security guarantee
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-white/[0.01] rounded-lg">
              <CircleCheckBig className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">24/7 Support</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Our support team is available around the clock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
