import type { AccountType } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Clock, Gamepad2, ShoppingCart } from 'lucide-react';
import { AccountGameIcon } from '../GameComponents';

type CurrentlyRentedAccountsProps = {
  className?: string;
  accounts: AccountType[];
};

export default function CurrentlyRentedAccounts({ accounts, className }: CurrentlyRentedAccountsProps) {
  const { getRankColor } = useMapping();
  const router = useRouter();
  const getFormattedTimeRemaining = (expiryDateStr: string): string => {
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

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
  return (
    <div className={cn('w-full flex h-full flex-col justify-between', className)}>
      <div className="space-y-1 mb-4">
        {accounts.length > 0
          ? accounts.map((account) => {
              const mostRecentAction = account.actionHistory.reduce((latest, current) =>
                new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current,
              );

              const currentRanking = account.rankings.find(ranking => !ranking.isPrevious)!;
              const rankColor = getRankColor(currentRanking?.elo?.toLowerCase());
              return (
                <Link
                  to={`/accounts/${account.documentId}`}
                  key={account.id}
                  className={cn(
                    'group flex items-center justify-between',
                    'px-4 py-3 rounded-lg',
                    'hover:bg-zinc-100 dark:hover:bg-primary/10 cursor-pointer',
                    'transition-all duration-200',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AccountGameIcon size={32} game="lol" />
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

                        {getFormattedTimeRemaining(mostRecentAction.expirationDate.toString())}
                      </span>
                    </div>
                    <Link
                      to={`/accounts/${account.documentId}`}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Account
                    </Link>
                  </div>
                </Link>
              );
            })
          : (
              <div className="flex flex-col items-center justify-center text-center py-4 px-2 space-y-3 rounded-lg">
                <motion.div
                  className="border rounded-2xl p-4 flex items-center justify-center h-20 w-20"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Gamepad2 className="h-12 w-12 text-muted-foreground" />
                </motion.div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">No active accounts</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Rent an account to start playing.
                  </p>
                </div>

                <Button
                  onClick={() => router.navigate({ to: '/accounts' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Browse Accounts
                </Button>
              </div>
            )}
      </div>

      {/* <Button variant="outline" className=" w-full  flex items-center justify-center gap-1"> */}
      {/*  <span>View All Rented Accounts</span> */}
      {/*  <ArrowRight className="w-3.5 h-3.5" /> */}
      {/* </Button> */}
    </div>
  );
}
