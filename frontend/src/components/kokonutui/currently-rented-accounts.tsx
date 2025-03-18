import type { AccountType } from '@/types/types.ts';
import { NoActiveAccounts } from '@/components/empty-states.tsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Clock } from 'lucide-react';
import { AccountGameIcon } from '../GameComponents';

type CurrentlyRentedAccountsProps = {
  className?: string;
  accounts: AccountType[];
};

export default function CurrentlyRentedAccounts({ accounts, className }: CurrentlyRentedAccountsProps) {
  // Helper function to calculate time remaining
  const getFormattedTimeRemaining = (expiryDateStr: string): string => {
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    // Check if already expired
    if (diffMs <= 0) {
      // Return expired message
      return 'Expired';
    }

    // Calculate days and hours
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    // Format the time string
    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      return `${hours}h left`;
    } else {
      // Less than an hour left
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}m left`;
    }
  };
  if (!accounts || accounts.length === 0) {
    return <NoActiveAccounts onBrowse={() => void 0} />;
  }
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

  return (
    <div className={cn('w-full flex h-full flex-col justify-between', className)}>
      <div className="space-y-1 mb-4">
        {accounts.map((account) => {
          const mostRecentAction = account.actionHistory.reduce((latest, current) =>
            new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current,
          );

          const currentRanking = account.rankings.find(ranking => !ranking.isPrevious)!;
          const rankColor = getRankColor(currentRanking?.elo?.toLowerCase());
          return (
            <div
              key={account.id}
              className={cn(
                'group flex items-center justify-between',
                'p-2 rounded-lg',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
                'transition-all duration-200',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <AccountGameIcon game="lol" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {account.id}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] font-medium ${rankColor} capitalize`}>
                      {currentRanking.elo}
                      {' '}
                      {currentRanking.division}
                    </span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      •
                      {' '}
                      {account.LCUchampions.length}
                      {' '}
                      Champions •
                      {' '}
                      {account.LCUskins.length}
                      {' '}
                      Skins
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100">

                    {getFormattedTimeRemaining(mostRecentAction.expirationTime.toString())}
                  </span>
                </div>
                <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">View Account</button>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="outline" className=" w-full  flex items-center justify-center gap-1">
        <span>View All Rented Accounts</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
