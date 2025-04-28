import type { AccountType } from '@/types/types.ts';
import { ChampionsSkinsTab } from '@/components/account-id/ChampionsSkinsTab.tsx';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { CopyToClipboard } from '@/components/CopyToClipboard.tsx';
import { DropAccountAction } from '@/components/DropAccountAction.tsx';
import { RentedAccountButton } from '@/components/RentedAccountAction.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { FavoriteAccountNote } from '@/features/favorite-account/components/FavoriteAccountNote.tsx';
import { FavoriteStar } from '@/features/favorite-account/components/FavoriteStar.tsx';
import { useAccountActions } from '@/hooks/useAccountActions.ts';
import { useAccountFilters } from '@/hooks/useAccountFilters.ts';
import { useDateTime } from '@/hooks/useDateTime.ts';
import { usePrice } from '@/hooks/usePrice.ts';
import { useRiotAccount } from '@/hooks/useRiotAccount.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { AlertCircle, AlertOctagon, AlertTriangle, Check, CircleCheckBig, Clock, Search, Shield, X } from 'lucide-react';
import { useState } from 'react';
import AccountInfoDisplay from './account-info-display.tsx';

function LeaverBusterDisplay({ account, compact = false }: {
  account: AccountType;
  compact?: boolean;
}) {
  const { getLeaverBusterInfo } = useRiotAccount({ account });
  const leaverInfo = getLeaverBusterInfo();

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
export default function AccountDetails({ account, onAccountChange }: {
  onAccountChange: () => Promise<void>;
  account: AccountType;
}) {
  const { user } = useUserStore();
  const { championsSearch, setChampionsSearch, skinsSearch, setSkinsSearch, filteredChampions, filteredSkins } = useAccountFilters({ account });
  const { dropRefund, selectedRentalOptionIndex, handleExtendAccount, isExtendPending, setSelectedRentalOptionIndex, isRentPending, handleRentAccount } = useAccountActions({ account, onAccountChange, user });
  const [activeTab, setActiveTab] = useState(0);
  const { getCompanyIcon, getGameIcon, getFormattedServer } = useMapping();
  const soloQueueRank = account.rankings?.find(lc => lc.queueType === 'soloqueue');
  const flexQueueRank = account.rankings?.find(lc => lc.queueType === 'flex');
  const { calculateTimeRemaining } = useDateTime();
  const { price, getAccountPrice, isPriceLoading } = usePrice();

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
                    <div className=" space-x-3">
                      <span className="">

                        {account.documentId.slice(0, 10)}

                      </span>

                      <CopyToClipboard className="bg-transparent border-none h-4 w-4 !p-0 " text={account.documentId} />

                      <FavoriteStar account={account} />
                      <FavoriteAccountNote account={account} />
                    </div>
                    {
                      account.gamename

                        ? (
                            <div className="flex gap-4 items-center ">
                              <span className="text-sm text-muted-foreground   transition-all duration-200">{`${account.gamename}#${account.tagline}`}</span>
                              <CopyToClipboard className="bg-transparent p-0 w-0 h-0" text={`${account.gamename}#${account.tagline}`} />
                            </div>
                          )
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
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{getFormattedServer(account.server)}</p>
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
                  {/* <svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" fill="none"> */}
                  {/*  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.63343 2.25848L6.5001 0.600098L4.36676 2.25848V8.25781L6.5001 9.7405L8.63343 8.25781V2.25848ZM12.0468 6.1152L12.9001 5.49383L10.3401 3.11553V9.11486L7.35343 11.2575V13.4001L12.9001 9.68479L12.0468 8.68634V6.1152ZM2.6601 3.11553L0.100098 5.49383L0.953431 6.1152V8.68634L0.100098 9.68479L5.64676 13.4001V11.2575L2.6601 9.11486V3.11553Z" fill="#E2BA3D" /> */}
                  {/* </svg> */}
                  <img alt="rp" src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/icon-rp-72.png" />

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
        {account.user && account.user.id === user?.id
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
                        className="flex  items-center gap-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50 "
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
                      {isPriceLoading
                        ? Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-12 w-full" />
                          ))
                        : (price && getAccountPrice(price, soloQueueRank?.elo).map((option, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="flex border-primary/10 bg-white/[0.001] flex-col items-center gap-1 h-auto py-2"
                              onClick={() => handleExtendAccount(index)}
                              disabled={isExtendPending}
                            >
                              <span className="text-sm">
                                {option.hours}
                                h
                              </span>
                              <div className="flex items-center gap-0.5 text-xs">
                                <CoinIcon className="w-3 h-3 text-amber-500" />
                                {option.price.toLocaleString()}
                              </div>
                            </Button>
                          ))
                          )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">

                  <RentedAccountButton account={account} />

                  <DropAccountAction
                    account={account}
                    user={user}
                    onSuccess={onAccountChange}
                    buttonVariant="outline"
                  />
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
                    {!isPriceLoading && price && getAccountPrice(price, soloQueueRank?.elo) && getAccountPrice(price, soloQueueRank?.elo).map((option, index) => (
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
                              {option.hours}
                              {' '}
                              {option.hours === 1 ? 'hour' : 'hours'}
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
                          {option.price.toLocaleString()}
                          {' '}
                          coins
                        </div>
                      </div>
                    ))}
                    {isPriceLoading && Array.from({ length: 3 }).fill(0).map((_, index) => (
                      <Skeleton key={index} className="h-24 w-full" />
                    ))}
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Price</span>
                      <div
                        className="flex items-center gap-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                      >
                        <CoinIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        {!isPriceLoading && price && getAccountPrice(price, soloQueueRank?.elo) && selectedRentalOptionIndex !== undefined
                          ? getAccountPrice(price, soloQueueRank?.elo)[selectedRentalOptionIndex]?.price.toLocaleString() || '0'
                          : <Skeleton className="w-10 h-6" />}
                        {' '}
                        coins
                      </div>
                    </div>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!price || (price && !getAccountPrice(price, soloQueueRank?.elo)) || isPriceLoading || isRentPending || selectedRentalOptionIndex == null}
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
