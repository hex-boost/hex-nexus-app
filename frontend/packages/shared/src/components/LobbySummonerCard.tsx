import {RankCard} from '@/components/RankCard.tsx';
import {useMapping} from '@/lib/useMapping.tsx';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {Skeleton} from './ui/skeleton';

type LobbySummonerCardProps = {
  summonerName?: string;
  summonerTag?: string;
  championName?: string;
  championLoadingImage?: string;
  championSquareImage?: string;
  winRate?: number;
  gamesPlayed?: number;
  kda?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  rank?: string;
  rankPoints?: number;
  rankPointsLabel?: string;
  winPercentage?: number;
  victories?: number;
  defeats?: number;
  rankIcon?: string;
  onOpenOpgg?: () => void;
  onOpenBlitz?: () => void;
  isLoading?: boolean;
};

export function LobbySummonerCard({
  summonerName,
  summonerTag,
  championName,
  championLoadingImage,
  championSquareImage,
  // winRate,
  // gamesPlayed,
  kda,
  kills,
  deaths,
  assists,
  rank,
  rankPoints,
  rankPointsLabel,
  winPercentage,
  victories,
  defeats,
  // rankIcon,
  onOpenOpgg,
  onOpenBlitz,
  isLoading = false,
}: LobbySummonerCardProps) {
  // Check if we have enough valid data to display
  const hasValidImage = championLoadingImage && championLoadingImage.length > 0;
  const { getEloIcon } = useMapping();
  // Empty state rendering

  return (
    <div className="relative  aspect-[3/4] bg-card overflow-hidden rounded-xl">
      {hasValidImage ? (
        <img
          alt={championName}
          className="absolute top-0 w-full object-contain object-top z-0 transition-transform duration-300 rounded-lg scale-105"
          src={championLoadingImage}
          onError={(e) => {
            // If image fails to load, remove it to show background color
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : null}

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-card from-40% to-transparent transition-opacity duration-300" />

      {/* Centered content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-end p-4">
        <p className="text-xl font-bold">
          {summonerName}
          {summonerTag && (
            <span className="text-muted-foreground">
              {' '}
              #
              {summonerTag}
            </span>
          )}
        </p>

        <p className="text-muted-foreground font-light text-xs uppercase">{championName}</p>

        {/* Stats section */}
        <div className="flex gap-4 items-center mt-4">
          <Avatar className="rounded-md">
            {championSquareImage
              ? (
                  <AvatarImage
                    className="scale-110"
                    alt={championName || 'Champion'}
                    src={championSquareImage}
                  />
                )
              : (
                  <AvatarFallback className="bg-card">?</AvatarFallback>
                )}
          </Avatar>

          <div className="flex flex-col justify-center items-center">
            <p className="text-sm font-bold">
              {kda ? kda.toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">
              {kills ?? 0}
              /
              {deaths ?? 0}
              /
              {assists ?? 0}
            </p>
          </div>

          {winPercentage !== undefined && (
            <div className="flex flex-col justify-center items-center">
              <p className="text-sm font-bold">
                {winPercentage}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                {victories ?? 0}
                W
                {defeats ?? 0}
                L
              </p>
            </div>
          )}
        </div>

        {/* Rank info */}
        <div className="w-full mt-4">
          <RankCard
            title="unrakned"
            badgeUrl={getEloIcon(rank || 'unranked')}
            winPercentage={0}
            rank={rank || 'Unranked'}
            points={rankPoints || 0}
            victories={victories || 0}
            defeats={defeats || 0}
            pointsLabel={rankPointsLabel}
          />
        </div>

      </div>
    </div>
  );
}

function LobbySummonerCardSkeleton() {
  return (
    <div className="relative max-w-xs aspect-[3/4] bg-card overflow-hidden rounded-xl">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-card from-40% to-transparent" />
      <div className="relative z-20 h-full flex flex-col items-center justify-end p-4">
        <Skeleton className="h-6 w-32 mb-1" />
        <Skeleton className="h-3 w-20 mb-6" />

        <div className="flex gap-4 items-center mt-4 w-full justify-center">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-4 w-10 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-8 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        <div className="w-full mt-6">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>

        <div className="flex justify-center gap-2 mt-4 w-full">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}
