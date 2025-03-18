'use client';

import type { AccountType } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { useMapping } from '@/lib/useMapping';
import { cn } from '@/lib/utils';
import { AccountGameIcon } from './GameComponents';

// Define the Account type based on your data structure

// Helper function to derive status from account properties
const getAccountStatus = (account: AccountType): 'Available' | 'Rented' | 'Reserved' | 'Maintenance' => {
  if (account.isRented) {
    return 'Rented';
  }
  // if (account.type === 'maintenance') {
  //   return 'Maintenance';
  // }
  // if (account.type === 'reserved') {
  //   return 'Reserved';
  // }
  return 'Available';
};

// Helper function to get status color
const getStatusColor = (status: 'Available' | 'Rented' | 'Reserved' | 'Maintenance') => {
  switch (status) {
    case 'Available':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    case 'Rented':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'Reserved':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'Maintenance':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  }
};

// Helper function to get leaver buster status info
// const getLeaverBusterInfo = (status: 'None' | 'Low' | 'Medium' | 'High' | null) => {
//   switch (status) {
//     case 'Low':
//       return {
//         color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
//         icon: AlertTriangle,
//         label: 'Low Priority (5min)',
//         description: 'This account has a low-priority queue of 5 minutes for 3 games.',
//       };
//     case 'Medium':
//       return {
//         color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
//         icon: AlertTriangle,
//         label: 'Low Priority (10min)',
//         description: 'This account has a low-priority queue of 10 minutes for 5 games.',
//       };
//     case 'High':
//       return {
//         color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
//         icon: Ban,
//         label: 'Low Priority (20min)',
//         description: 'This account has a low-priority queue of 20 minutes for 5 games.',
//       };
//     case 'None':
//     case null:
//     default:
//       return {
//         color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
//         icon: Shield,
//         label: 'No Penalties',
//         description: 'This account has no leaver buster penalties.',
//       };
//   }
// };

// Simplified props interface that takes the whole account object
type AccountInfoDisplayProps = {
  account: AccountType;
  compact?: boolean;
};

export default function AccountInfoDisplay({
  account,
}: AccountInfoDisplayProps) {
  const { getRankColor } = useMapping();

  const status = getAccountStatus(account);

  const placeholderRank = {
    tier: 'Gold',
    rank: 'IV',
    lp: 75,
  };

  return (
    <div className={cn('w-full', 'space-y-4')}>
      {/* Header with ID and Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AccountGameIcon game="lol" />
          <span className="text-sm font-medium">{account.username}</span>
        </div>
        <Badge className={cn('px-3 py-1', getStatusColor(status))}>{status}</Badge>
      </div>

      {/* Game Name (if available) */}
      {account.gamename && (
        <div className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          {account.gamename}
          {account.tagline ? `#${account.tagline}` : ''}
        </div>
      )}

      {/* Rank information - using placeholders since actual rank data is not provided */}
      <div className={cn('grid gap-3', 'grid-cols-1 sm:grid-cols-2')}>
        {/* Solo Queue Rank - Using placeholder */}
        <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Solo Queue</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Not Available</p>
        </div>

        {/* Flex Queue Rank - Using placeholder */}
        <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Flex Queue</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Not Available</p>
        </div>
      </div>

      {/* Server Information */}
      <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Server</p>
        <p className="text-sm font-medium">{account.server}</p>
      </div>

      {/* Leaver Buster Status */}
      {/* <div className={cn('flex items-center gap-2 p-2 rounded-md', leaverBusterInfo.color)}> */}
      {/*   <LeaverIcon className="h-4 w-4" /> */}
      {/*   <span className={compact ? 'text-xs' : 'text-sm'}> */}
      {/*     {compact ? leaverBusterInfo.label : leaverBusterInfo.description} */}
      {/*   </span> */}
      {/* </div> */}

      {/* Available Champions Info */}
      {
        account.LCUchampions && account.LCUchampions.length > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Champions</p>
            <p className="text-sm font-medium">
              {account.LCUchampions.length}
              {' '}
              available
            </p>
          </div>
        )
      }

      {/* Available Skins Info */}
      {
        account.LCUskins && account.LCUskins.length > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Skins</p>
            <p className="text-sm font-medium">
              {account.LCUskins.length}
              {' '}
              available
            </p>
          </div>
        )
      }
    </div>
  );
}
