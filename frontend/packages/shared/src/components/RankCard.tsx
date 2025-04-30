import {useMapping} from '@/lib/useMapping.tsx';

type RankCardProps = {
  title: string;
  rank: string;
  points: number;
  pointsLabel?: string;
  winPercentage: number;
  victories: number;
  defeats: number;
  badgeUrl?: string;
};

export function RankCard({
  rank = 'Bronze 2',
  points = 89,
  pointsLabel = 'PDL',
  winPercentage = 30.8,
  victories = 20,
  defeats = 45,
}: RankCardProps) {
  const { getEloIcon } = useMapping();
  const progressPercentage = Math.min(points, 100);

  return (
    <div className="w-full max-w-xs rounded-md  text-white ">

      <div className="flex gap-2 items-center">
        <div>
          <img
            src={getEloIcon(rank)}
            alt={`${rank} badge`}
            height={60}
          />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-[#C27C3A] font-medium">{rank}</div>
            <span className="text-sm text-gray-300">
              {points}
              {' '}
              {pointsLabel}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#1E1E24] rounded-full w-full mb-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8E5524] to-[#C27C3A]"
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
