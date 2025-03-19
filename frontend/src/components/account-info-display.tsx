'use client';

import { Badge } from '@/components/ui/badge';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';

type AccountInfoDisplayProps = {
  accountId: string;
  game: 'lol' | 'valorant';
  status: 'Available' | 'Rented' | 'Reserved' | 'Maintenance';
  gameName?: string;
  leaverBusterStatus?: 'None' | 'Low' | 'Medium' | 'High';
  soloQueueRank: {
    elo: string;
    division: string;
    points: number;
  };
  flexQueueRank?: {
    elo: string;
    division: string;
    points: number;
  };
  previousSeasonRank?: {
    tier: string;
    rank: string;
    season: number;
  };
  valorantRank?: {
    tier: string;
    rank: string;
  };
  compact?: boolean;
};

// Helper function to get rank color

// Helper function to get tier icon
const getTierIcon = (tier: string) => {
  // In a real app, you would use actual tier icons
  return `/placeholder.svg?height=24&width=24&text=${tier.charAt(0)}`;
};

// Helper function to get game icon
const getGameIcon = (game: 'lol' | 'valorant') => {
  if (game === 'lol') {
    return '/placeholder.svg?height=24&width=24&text=LoL';
  } else {
    return '/placeholder.svg?height=24&width=24&text=VAL';
  }
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
// const getLeaverBusterInfo = (status: 'None' | 'Low' | 'Medium' | 'High') => {
//   switch (status) {
//     case 'None':
//       return {
//         color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
//         icon: Shield,
//         label: 'No Penalties',
//         description: 'This account has no leaver buster penalties.',
//       };
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
//   }
// };

export default function AccountInfoDisplay({
  accountId,
  game,
  status,
  gameName,
  leaverBusterStatus,
  soloQueueRank,
  flexQueueRank,
  previousSeasonRank,
  compact = false,
}: AccountInfoDisplayProps) {
  // const leaverBusterInfo = getLeaverBusterInfo(leaverBusterStatus);
  // const LeaverIcon = leaverBusterInfo.icon;
  const { getRankColor, getEloIcon } = useMapping();
  return (
    <div className={cn('w-full', compact ? 'space-y-2' : 'space-y-4')}>
      {/* Header with ID and Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img
            src={getGameIcon(game) || '/placeholder.svg'}
            alt={game === 'lol' ? 'League of Legends' : 'Valorant'}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium">{accountId}</span>
        </div>
        <Badge className={cn('px-3 py-1', getStatusColor(status))}>{status}</Badge>
      </div>

      {/* Game Name (if available) */}
      {gameName && <div className="text-base font-medium text-zinc-900 dark:text-zinc-50">{gameName}</div>}

      {/* Rank information */}
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        <>
          {/* Solo Queue Rank */}
          <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Solo Queue</p>
            {soloQueueRank
              ? (
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getEloIcon(soloQueueRank.elo) || '/placeholder.svg'}
                      alt={soloQueueRank.elo}
                      className="w-5 h-5"
                    />
                    <div>

                      <p className={`text-sm font-medium ${getRankColor(soloQueueRank.elo)}`}>
                        {soloQueueRank.elo}
                        {' '}
                        {soloQueueRank.division}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {soloQueueRank.points}
                        {' '}
                        LP
                      </p>
                    </div>
                  </div>
                )
              : previousSeasonRank
                ? (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTierIcon(previousSeasonRank.tier) || '/placeholder.svg'}
                        alt={previousSeasonRank.tier}
                        className="w-5 h-5 opacity-70"
                      />
                      <div>
                        <p className={`text-sm font-medium ${getRankColor(previousSeasonRank.tier)} opacity-70`}>
                          Unranked
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          S
                          {previousSeasonRank.season}
                          :
                          {' '}
                          {previousSeasonRank.tier}
                          {' '}
                          {previousSeasonRank.rank}
                        </p>
                      </div>
                    </div>
                  )
                : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Unranked</p>
                  )}
          </div>

          {/* Flex Queue Rank */}
          <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Flex Queue</p>
            {flexQueueRank
              ? (
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getTierIcon(flexQueueRank.tier) || '/placeholder.svg'}
                      alt={flexQueueRank.tier}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className={`text-sm font-medium ${getRankColor(flexQueueRank.tier)}`}>
                        {flexQueueRank.tier}
                        {' '}
                        {flexQueueRank.rank}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {flexQueueRank.lp}
                        {' '}
                        LP
                      </p>
                    </div>
                  </div>
                )
              : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Unranked</p>
                )}
          </div>
        </>

      </div>

      {/* Leaver Buster Status */}
      {/* <div className={cn('flex items-center gap-2 p-2 rounded-md', leaverBusterInfo.color)}> */}
      {/*  <LeaverIcon className="h-4 w-4" /> */}
      {/*  <span className={compact ? 'text-xs' : 'text-sm'}> */}
      {/*    {compact ? leaverBusterInfo.label : leaverBusterInfo.description} */}
      {/*  </span> */}
      {/* </div> */}
    </div>
  );
}
