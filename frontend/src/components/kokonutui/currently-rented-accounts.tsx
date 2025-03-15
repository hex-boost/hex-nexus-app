import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Clock, User } from 'lucide-react';

type Account = {
  id: string;
  tier: string;
  rank: string;
  rentedAt: string;
  expiresAt: string;
  champions: number;
  skins: number;
};

type CurrentlyRentedAccountsProps = {
  className?: string;
  accounts?: Account[];
};

const ACCOUNTS: Account[] = [
  {
    id: 'X7F9P2',
    tier: 'Diamond',
    rank: 'II',
    rentedAt: '2024-03-10T10:30:00Z',
    expiresAt: '2024-03-17T10:30:00Z',
    champions: 145,
    skins: 78,
  },
  {
    id: 'R5M3K8',
    tier: 'Platinum',
    rank: 'I',
    rentedAt: '2024-03-12T15:45:00Z',
    expiresAt: '2024-03-19T15:45:00Z',
    champions: 132,
    skins: 65,
  },
  {
    id: 'L2G7T4',
    tier: 'Master',
    rank: '',
    rentedAt: '2024-03-13T09:15:00Z',
    expiresAt: '2024-03-20T09:15:00Z',
    champions: 158,
    skins: 112,
  },
];

export default function CurrentlyRentedAccounts({ accounts = ACCOUNTS, className }: CurrentlyRentedAccountsProps) {
  // Helper function to calculate time remaining
  const getTimeRemaining = (expiryDateStr: string) => {
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    // Convert to days and hours
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours };
  };

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
          const { days, hours } = getTimeRemaining(account.expiresAt);
          const rankColor = getRankColor(account.tier);

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

                  <User className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{account.id}</h3>
                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] font-medium ${rankColor}`}>
                      {account.tier}
                      {' '}
                      {account.rank}
                    </span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      •
                      {' '}
                      {account.champions}
                      {' '}
                      champions •
                      {' '}
                      {account.skins}
                      {' '}
                      skins
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100">
                    {days}
                    d
                    {hours}
                    h left
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
