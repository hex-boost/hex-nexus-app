import AccountInfoDisplay from '@/components/account-info-display';
import AccountActiveState from '@/components/active-account-state';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_protected/ActiveAccounts')({
  component: MyAccounts,
});

const ACTIVE_ACCOUNTS = [
  {
    accountId: 'A7F9P2',
    game: 'lol',
    rentedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
    gameName: 'HiddenSniper92',
    refundableAmount: 1600,
    leaverBusterStatus: 'None' as const,
    soloQueueRank: {
      tier: 'Diamond',
      rank: 'II',
      lp: 75,
    },
    flexQueueRank: {
      tier: 'Platinum',
      rank: 'III',
      lp: 42,
    },
  },
  {
    accountId: 'B5M3K8',
    game: 'lol',
    rentedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(), // 20 hours from now
    gameName: 'MidOrFeed123',
    refundableAmount: 1200,
    leaverBusterStatus: 'Low' as const,
    soloQueueRank: {
      tier: 'Platinum',
      rank: 'I',
      lp: 89,
    },
  },
  {
    accountId: 'C2G7T4',
    game: 'valorant',
    rentedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 46).toISOString(), // 46 hours from now
    refundableAmount: 3750,
    gameName: 'RadiantAimer',
    leaverBusterStatus: 'Medium' as const,
    valorantRank: {
      tier: 'Immortal',
      rank: '3',
    },
  },
];

// Sample data for rental history
const RENTAL_HISTORY = [
  {
    accountId: 'D9R4Z1',
    game: 'lol',
    status: 'Available' as const,
    leaverBusterStatus: 'None' as const,
    soloQueueRank: {
      tier: 'Gold',
      rank: 'IV',
      lp: 32,
    },
    rentedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
  },
  {
    accountId: 'E3X8V6',
    game: 'valorant',
    status: 'Available' as const,
    leaverBusterStatus: 'High' as const,
    valorantRank: {
      tier: 'Radiant',
      rank: '',
    },
    rentedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days ago
  },
  {
    accountId: 'F1Y5W9',
    game: 'lol',
    status: 'Rented' as const,
    leaverBusterStatus: 'Low' as const,
    previousSeasonRank: {
      tier: 'Gold',
      rank: 'II',
      season: 13,
    },
    rentedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(), // 21 days ago
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), // 20 days ago
  },
];
function MyAccounts() {
  const [_, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter accounts based on search
  const filteredActiveAccounts = ACTIVE_ACCOUNTS.filter(
    account =>
      account.accountId.toLowerCase().includes(searchQuery.toLowerCase())
      || (account.gameName && account.gameName.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const filteredHistoryAccounts = RENTAL_HISTORY.filter(account =>
    account.accountId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder="Search by account ID or game name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

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
      </div>

      {/* Tabs for Active and History */}
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active Accounts (
            {filteredActiveAccounts.length}
            )
          </TabsTrigger>
          <TabsTrigger value="history">
            Rental History (
            {filteredHistoryAccounts.length}
            )
          </TabsTrigger>
        </TabsList>

        {/* Active Accounts Tab */}
        <TabsContent value="active" className="space-y-6 pt-4">
          {filteredActiveAccounts.length > 0
            ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActiveAccounts.map(account => (
                  <AccountActiveState
                    key={account.accountId}
                    accountId={account.accountId}
                    game={account.game as 'lol' | 'valorant'}
                    rentedAt={account.rentedAt}
                    expiresAt={account.expiresAt}
                    gameName={account.gameName}
                    refundableAmount={account.refundableAmount}
                    leaverBusterStatus={account.leaverBusterStatus}
                    soloQueueRank={account.soloQueueRank}
                    flexQueueRank={account.flexQueueRank}
                    valorantRank={account.valorantRank}
                  />
                ))}
              </div>
            )
            : (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">
                  {searchQuery ? 'No active accounts match your search criteria.' : 'You don\'t have any active accounts.'}
                </p>
                <Button className="mt-4">Browse Available Accounts</Button>
              </div>
            )}
        </TabsContent>

        {/* Rental History Tab */}
        <TabsContent value="history" className="space-y-6 pt-4">
          {filteredHistoryAccounts.length > 0
            ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHistoryAccounts.map(account => (
                  <div
                    key={account.accountId}
                    className="bg-white dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Rented:
                        {' '}
                        {new Date(account.rentedAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Expired:
                        {' '}
                        {new Date(account.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <AccountInfoDisplay
                      accountId={account.accountId}
                      game={account.game as 'lol' | 'valorant'}
                      status={account.status}
                      leaverBusterStatus={account.leaverBusterStatus}
                      soloQueueRank={account.soloQueueRank}
                      previousSeasonRank={account.previousSeasonRank}
                      valorantRank={account.valorantRank}
                    />
                  </div>
                ))}
              </div>
            )
            : (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">
                  {searchQuery ? 'No rental history matches your search criteria.' : 'You don\'t have any rental history.'}
                </p>
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sample data for active accounts
