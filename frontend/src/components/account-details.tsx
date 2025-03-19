'use client';

import type { AccountType } from '@/types/types.ts';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccountDetails } from '@/hooks/useAccountDetails.ts';
import { useDataDragon } from '@/hooks/useDataDragon.ts';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, Check, Clock, LogIn, Search, Shield, X } from 'lucide-react';
import AccountInfoDisplay from './account-info-display';

// Types

type RentalOption = {
  hours: number;
  price: number;
};

// Rental options

// Helper function to get skin rarity color

export default function AccountDetails({ account, rentalOptions }: {
  rentalOptions: RentalOption[];
  account: AccountType;
}) {
  const {
    selectedRentalOption,
    setSelectedRentalOption,
    championsSearch,
    setChampionsSearch,
    skinsSearch,
    setSkinsSearch,
    isDropDialogOpen,
    setIsDropDialogOpen,
    // filteredChampions,
    // filteredSkins,
    handleLoginToAccount,
    handleRentAccount,
    handleDropAccount,
  } = useAccountDetails({ account, rentalOptions });

  const gameType = account.bannedGames?.includes('league') ? 'valorant' : 'lol';

  // Function to get rank info from rankings array
  const getSoloQueueRank = () => {
    const soloRank = account.rankings?.find(r => r.queueType === 'soloqueue');
    return { elo: soloRank?.elo, points: soloRank?.points, division: soloRank?.division };
  };

  // const getFlexQueueRank = () => {
  //   const flexRank = account.rankings?.find(r => r.queueType === 'flex');
  //   return { elo: flexRank.elo, points: flexRank.points, division: flexRank.division };
  // };
  // const {} = useMapping();
  const {
    filteredChampions,
    filteredSkins,
    isLoading: isDragonLoading,
    error: dragonError,
  } = useDataDragon({
    account,
    championsSearch,
    skinsSearch,
  });
  return (

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Account details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Account info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Account Information</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <img
                  src={`/placeholder.svg?height=40&width=40&text=${account.type.split(' ')[0]}`}
                  alt={account.type}
                  className="w-4 h-4 rounded-sm"
                />
                {account.type}
              </Badge>
            </CardTitle>
            <CardDescription>
              Detailed information about this
              account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Info Display Component */}
            <AccountInfoDisplay
              accountId={account.documentId}
              game="lol"
              status={account.user ? 'Rented' : 'Available'}
              leaverBusterStatus="None"
              soloQueueRank={getSoloQueueRank()}
              // flexQueueRank={getFlexQueueRank()}
              // previousSeasonRank={'unknown'}
              // valorantRank={'unknown'}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {'lol' === 'lol' && (
                <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Champions</p>
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{account.LCUchampions.length}</p>
                </div>
              )}

              <div className={'lol' === 'valorant' ? 'col-span-2' : ''}>
                <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Skins</p>
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{account.LCUskins.length}</p>
                </div>
              </div>

              {/* <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md"> */}
              {/*    <p className="text-xs text-zinc-600 dark:text-zinc-400">Win Rate</p> */}
              {/*    <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50"> */}
              {/*        {account.winRate} */}
              {/*        % */}
              {/*    </p> */}
              {/* </div> */}

              {/* <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md"> */}
              {/*  <p className="text-xs text-zinc-600 dark:text-zinc-400">Last Played</p> */}
              {/*   <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{account.lastPlayed}</p> */}
              {/* </div> */}
            </div>

            {/* Essence - more compact */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">BE</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-zinc-600 dark:text-zinc-400">Blue Essence:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {account.blueEssence}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
                >
                  <span className="text-white text-xs font-bold">OE</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-zinc-600 dark:text-zinc-400">Orange Essence:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {account.riotPoints}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Champions and Skins tabs */}
        <Tabs defaultValue={'lol' === 'lol' ? 'champions' : 'skins'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {'lol' === 'lol' && (
              <TabsTrigger value="champions">
                Champions (
                {account.LCUchampions.length}
                )
              </TabsTrigger>
            )}
            <TabsTrigger value="skins" className={'lol' === 'valorant' ? 'col-span-2' : ''}>
              Skins (
              {account.LCUskins.length}
              )
            </TabsTrigger>
          </TabsList>

          {/* Champions Tab */}
          {'lol' === 'lol' && (
            <TabsContent value="champions" className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400"
                />
                <Input
                  placeholder="Search champions..."
                  value={championsSearch}
                  onChange={e => setChampionsSearch(e.target.value)}
                  className="pl-9"
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

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {filteredChampions.map(champion => (
                  <div
                    key={champion.id}
                    className="bg-zinc-50 dark:bg-zinc-800/30 rounded-md overflow-hidden flex flex-col items-center"
                  >
                    <img
                      src={champion.imageUrl}
                      alt={champion.name}
                      className="w-full h-auto object-cover"
                      style={{ height: '50px', width: '50px' }}
                    />
                    <div className="p-1 text-center w-full">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate w-full">
                        {champion.name}
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
            </TabsContent>
          )}

          {/* Skins Tab */}
          <TabsContent value="skins" className="space-y-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400"
              />
              <Input
                placeholder="Search skins or champions..."
                value={skinsSearch}
                onChange={e => setSkinsSearch(e.target.value)}
                className="pl-9"
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredSkins.map(skin => (
                <div
                  key={skin.id}
                  className="bg-zinc-50 dark:bg-zinc-800/30 rounded-md overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={skin.imageUrl}
                      alt={skin.name}
                      className="w-full h-auto object-cover"
                    />
                    <Badge
                      className={cn('absolute top-1 right-1 text-[10px] px-1 py-0', skin.rarity)}
                    >
                      {skin.rarity}
                    </Badge>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Right column - Rental options */}
      <div className="space-y-6">
        {account.user ? (/* Rented Account Card */
          <Card>
            <CardHeader>
              <CardTitle>Rented Account</CardTitle>
              <CardDescription>This account is currently rented by you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time remaining */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Expires on
                  </span>
                  {/* <span className="font-medium">{new Date(account.expiresAt!).toLocaleString()}</span> */}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Refundable Amount</span>
                  <div
                    className="flex items-center gap-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                  >
                    <CoinIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    {/* {account.refundableAmount!.toLocaleString()} */}
                    {' '}
                    coins
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleLoginToAccount}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login to
                {' '}
                {'lol' === 'lol' ? 'LoL' : 'Valorant'}
              </Button>

              <Dialog open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    <ArrowDownToLine className="h-4 w-4" />
                    Drop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Drop Account & Refund</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to drop this account? You will be refunded
                      {' '}
                      {/* {account.refundableAmount} */}
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
                      onClick={handleDropAccount}
                      className="flex items-center gap-1"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Drop & Refund
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ) : (/* Rental Card */
          <Card>
            <CardHeader>
              <CardTitle>Rent This Account</CardTitle>
              <CardDescription>Choose your preferred rental duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {rentalOptions.map(option => (
                  <div
                    key={option.hours}
                    className={cn('border rounded-lg p-3 cursor-pointer transition-all', selectedRentalOption.hours === option.hours ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700')}
                    onClick={() => setSelectedRentalOption(option)}
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
                      {selectedRentalOption.hours === option.hours && (
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
                    {option.hours === 24 && (
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
                    {selectedRentalOption.price.toLocaleString()}
                    {' '}
                    coins
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleRentAccount}
                >
                  Rent Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account security card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
              <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Verified Account</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  This account has been verified
                  by our team
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
              <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Secure Rental</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Your rental is protected by our security guarantee
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
              <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
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
    </div>
  );
}
