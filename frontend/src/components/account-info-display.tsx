import type { RankingType } from '@/types/types.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';

type AccountInfoDisplayProps = {
  accountId: string;
  game: 'lol' | 'valorant';
  status: 'Available' | 'Rented' | 'Reserved' | 'Maintenance';
  gameName?: string;
  leaverBusterStatus?: 'None' | 'Low' | 'Medium' | 'High';
  soloQueueRank?: RankingType;
  flexQueueRank?: RankingType;
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
                    {rank.elo || 'Unranked'}
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







































export default function AccountInfoDisplay({
  
  
  
  gameName,
  
  soloQueueRank,
  flexQueueRank,
  previousSeasonRank,
  compact = false,
}: AccountInfoDisplayProps) {
  
  
  const { getRankColor, getEloIcon } = useMapping();
  return (
    <div className={cn('w-full', compact ? 'space-y-2' : 'space-y-4')}>

      {}
      {gameName && <div className="text-base font-medium text-zinc-900 dark:text-zinc-50">{gameName}</div>}

      {}
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        <>
          <RankDisplay
            title="Solo Queue"
            rank={soloQueueRank}
            previousSeasonRank={previousSeasonRank}
            getRankColor={getRankColor}
            getEloIcon={getEloIcon}
            
          />

          <RankDisplay
            title="Flex Queue"
            rank={flexQueueRank}
            getRankColor={getRankColor}
            getEloIcon={getEloIcon}
          />

        </>

      </div>

      {}
      {}
      {}
      {}
      {}
      {}
      {}
    </div>
  );
}
