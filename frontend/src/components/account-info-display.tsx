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
const eloColors = {
  league_of_legends_iron: '#51484A',
  league_of_legends_bronze: '#8C513A',
  league_of_legends_silver: '#80989D',
  league_of_legends_gold: '#CD8837',
  league_of_legends_emerald: '#149C3A',
  league_of_legends_platinum: '#25ACD6',
  league_of_legends_diamond: '#8141EB',
  league_of_legends_master: '#9D48E0',
  league_of_legends_grandmaster: '#CD4545',
  league_of_legends_challenger: '#F4C874',
  league_of_legends_unranked: '#6B6963',
};
function RankDisplay({
  title,
  rank,
  previousSeasonRank,
  getRankColor,
  getEloIcon,
  getTierIcon,
}: {
  title: string;
  rank?: {
    elo: string;
    division: string;
    points: number;
  };
  previousSeasonRank?: {
    tier: string;
    rank: string;
    season: number;
  };
  getRankColor: (tier: string) => string;
  getEloIcon: (elo: string) => string;
  getTierIcon?: (tier: string) => string;
}) {
  const currentRank = rank?.elo || previousSeasonRank?.tier || 'unranked';
  const rankColor = eloColors[`league_of_legends_${currentRank.toLowerCase()}`] || '#6B6963';

  return (
    <div className="bg-zinc-50
    space-y-2 border dark:bg-white/[0.01] p-3 rounded-lg"
    >
      {rank
        ? (
            <div className="flex justify-center flex-col items-center gap-4">
              <img
                src={getEloIcon(rank.elo) || '/placeholder.svg'}
                alt={rank.elo}
                className="w-16 h-16"
              />
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 items-end">

                  <p className={`text-sm capitalize font-medium `}>
                    {rank.elo}
                    {' '}
                    {rank.division}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {rank.points}
                    {' '}
                    LP
                  </p>
                </div>
                <p className="text-sm text-center font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
              </div>
            </div>
          )
        : previousSeasonRank
          ? (
              <div className="flex items-center gap-1.5">
                <img
                  src={getTierIcon?.(previousSeasonRank.tier) || '/placeholder.svg'}
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
  );
}

// Helper function to get game icon

// Helper function to get status color

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
  const { getGameIcon } = useMapping();
  return (
    <div className={cn('w-full', compact ? 'space-y-2' : 'space-y-4')}>

      {/* Game Name (if available) */}
      {gameName && <div className="text-base font-medium text-zinc-900 dark:text-zinc-50">{gameName}</div>}

      {/* Rank information */}
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        <>
          <RankDisplay
            title="Solo Queue"
            rank={soloQueueRank}
            previousSeasonRank={previousSeasonRank}
            getRankColor={getRankColor}
            getEloIcon={getEloIcon}
            // getTierIcon={getTierIcon}
          />

          <RankDisplay
            title="Flex Queue"
            rank={flexQueueRank}
            getRankColor={getRankColor}
            getEloIcon={getEloIcon}
          />

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
