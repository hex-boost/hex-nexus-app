import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';

type RankCardProps = {
  title: string;
  rank: string;
  division: string;
  points: number;
  pointsLabel?: string;
  winPercentage: number;
  victories: number;
  defeats: number;
  badgeUrl?: string;
};

export function RankCard({
  rank = 'Bronze',
  points = 89,
  pointsLabel = 'PDL',
  winPercentage = 30.8,
  division = 'I',
  victories = 20,
  defeats = 45,
}: RankCardProps) {
  const { getEloIcon, getRankColor, getRankBackground } = useMapping();
  const progressPercentage = Math.min(points, 100);

  return (
    <div className="w-full max-w-xs rounded-md  text-white ">

      <div className="flex gap-3 items-center p-4">
        <div>
          <img
            className="min-w-fit"
            src={getEloIcon(rank)}
            alt={`${rank} badge`}
            height={80}
            width={80}
          />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className={cn('font-medium', getRankColor(rank))}>
              <span>{rank[0].toUpperCase() + rank.slice(1).toLowerCase()}</span>
              {' '}
              {['unranked', 'master', 'grandmaster', 'challenger'].includes(rank.toLowerCase()) ? null : division}
            </div>
            <span className="text-sm text-gray-300">
              {points}
              {' '}
              {pointsLabel}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#1E1E24] rounded-full w-full mb-2 overflow-hidden">
            <div
              className={cn('h-full ', getRankBackground(rank.toLowerCase()))}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <div>
              {winPercentage.toFixed(1).replace('.', ',')}
              % PV
            </div>
            <div>
              {victories}
              V -
              {' '}
              {' '}
              {defeats}
              D
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
