import type { RankingType } from '@/types/types.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';

type RankDisplayProps = {
  ranking?: RankingType;
  className?: string;
  imageClass?: string;
  showLP?: boolean;
  showName?: boolean;
};

export function GameRankDisplay({
  ranking,
  showName = true,
  className,
  showLP = true,
  imageClass = 'w-6 h-6', // Default to 6 (w-6 h-6)
}: RankDisplayProps) {
  const elo = ranking?.elo?.name || 'unranked';
  const normalizedElo = elo.toLowerCase();
  const { getEloIcon } = useMapping();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <img
        className={imageClass}
        alt={elo}
        src={getEloIcon(elo)}
      />
      {normalizedElo !== 'unranked'
        ? (
            <span className={`text-xs capitalize font-medium `}>
              {showName && (
                <>
                  {elo.toLowerCase()}
                  {' '}
                </>
              )}
              {ranking?.division}
              {' '}
              {
                showLP && ranking?.points !== undefined && (
                  <span className="text-[10px]">
                    {ranking?.points}
                    {' '}
                    LP
                  </span>
                )
              }

            </span>
          )
        : null}
    </div>
  );
}
