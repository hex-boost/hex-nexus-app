// LobbySummonerCard.tsx
import { RankCard } from '@/components/RankCard.tsx';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';
import { Browser } from '@wailsio/runtime';
import { Avatar, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

export type LobbySummonerCardProps = {
  summonerName: string;
  gamesPlayed: number;
  wins: number;
  summonerTag: string;
  championName: string;
  platformId: string;
  kills: number;
  championSquareImage: string;
  championLoadingImage: string | null;
  deaths: number;
  assists: number;
  rank: string;
  division: string;
  rankPoints: number;
  victories: number;
  defeats: number;
};

function calculateWinPercentage(wins: number, losses: number) {
  return wins + losses > 0 ? (wins / (wins + losses) * 100) : 0;
}

function calculateKDA(kills: number, deaths: number, assists: number) {
  return deaths === 0 ? kills + assists : (kills + assists) / deaths;
}
export function LobbySummonerCard({
  championSquareImage,
  summonerName,
  summonerTag,
  championName,
  platformId,
  kills,
  deaths,
  assists,
  rank,
  division,
  championLoadingImage,
  rankPoints,
  victories,
  defeats,
  gamesPlayed,
  wins,

}: LobbySummonerCardProps) {
  // Derived values

  const winPercentage = calculateWinPercentage(victories, defeats);
  const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

  const { getEloIcon, getFormattedServer, getWinrateColorClass, getKdaColor } = useMapping();
  const rankIcon = getEloIcon(rank);
  const kdaValue = calculateKDA(kills, deaths, assists);
  // URL handlers
  const handleOpenOpgg = () =>
    Browser.OpenURL(`https://op.gg/lol/summoners/${getFormattedServer(platformId as any)}/${summonerName}-${summonerTag}`);

  const handleOpenBlitz = () =>
    Browser.OpenURL(`https://blitz.gg/lol/profile/${platformId}/${summonerName}-${summonerTag}`);

  return (
    <div className="relative max-w-xs aspect-[3/4] bg-card overflow-hidden rounded-xl">
      {championLoadingImage && (
        <img
          alt={championName}
          className="absolute top-0 w-full object-contain object-top z-0 transition-transform duration-300 rounded-lg scale-105"
          src={championLoadingImage}
        />
      )}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-card from-40% to-transparent" />

      <div className="relative z-20 h-full flex flex-col items-center justify-end pb-4">
        <p className="text-xl font-bold">
          {summonerName}
          {' '}
          <span className="text-muted-foreground font-medium text-lg">
            #
            {summonerTag}
          </span>
        </p>
        <p className="text-muted-foreground font-light text-xs uppercase">{championName}</p>

        <div className="flex gap-4 items-center mt-4">
          <Avatar className="rounded-md">
            <AvatarImage
              className="scale-110"
              alt={championName}
              src={championSquareImage}
            />
          </Avatar>
          <div className="flex flex-col items-center">
            <p className={cn('text-xs', getWinrateColorClass(winRate))}>
              {winRate.toFixed(1)}
              %
            </p>
            <p className="text-xs text-muted-foreground">
              {gamesPlayed}
              {' '}
              played
            </p>
          </div>
          <div className="flex flex-col items-center">
            <p className={cn('font-medium text-xs', getKdaColor(kdaValue))}>
              {kdaValue.toFixed(1)}
              {' '}
              KDA
            </p>
            <p className="text-xs">
              {kills}
              {' '}
              /
              {' '}
              {deaths}
              {' '}
              /
              {' '}
              {assists}
            </p>
          </div>
        </div>

        <RankCard
          title="Ranqueada Solo"
          rank={rank}
          points={rankPoints}
          division={division}
          pointsLabel="PDL"
          winPercentage={winPercentage}
          victories={victories}
          defeats={defeats}
          badgeUrl={rankIcon}
        />
        <div className="flex gap-2 px-4 w-full py-2">
          <Button
            variant="custom"
            className="bg-white/[0.01] gap-2 w-full hover:bg-white/[0.02] py-2"
            onClick={handleOpenOpgg}
          >
            <img
              src="https://s-opgg-kit.op.gg/gnb/config/images/icon/bfa5abe2f78d6e9a55e81c9988c31442.svg?image=q_auto:good,f_webp,w_48,h_48"
              width="24"
              height="24"
              alt=""
              loading="lazy"
            />
            <p className="text-medium text-muted-foreground">Opgg</p>
          </Button>
          <Button
            variant="custom"
            className="bg-white/[0.01] w-full hover:bg-white/[0.02] py-2 gap-2"
            onClick={handleOpenBlitz}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 -8 56 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="original-colors"
            >
              {/* SVG paths remain as is */}
              <path
                d="M24.13 64c-2.578 0-4.587-2.21-4.312-4.742l1.95-17.993A1.148 1.148 0 0 0 20.618 40H5.847a2.324 2.324 0 0 1-1.762-.805L2.55 37.412a2.265 2.265 0 0 1-.068-2.878L29.321.222A.58.58 0 0 1 29.778 0h2.046c2.577 0 4.586 2.21 4.311 4.742l-1.95 17.993A1.148 1.148 0 0 0 35.335 24h14.784c.672 0 1.31.289 1.75.791l1.568 1.794c.72.823.753 2.034.079 2.894l-26.884 34.3a.58.58 0 0 1-.457.221h-2.046Z"
                fill="url(#blitz-logo-a-0)"
              >
              </path>
              <path
                d="m20.812 59.365 1.95-17.993c.14-1.28-.874-2.372-2.143-2.372H5.846c-.39 0-.756-.17-1.004-.457L3.309 36.76a1.265 1.265 0 0 1-.038-1.61L29.98 1h1.843c1.995 0 3.526 1.706 3.317 3.635l-1.95 17.993c-.14 1.28.874 2.372 2.143 2.372H50.12c.385 0 .749.166.997.45l1.568 1.793c.404.462.422 1.137.045 1.62L25.972 63h-1.843c-1.995 0-3.526-1.706-3.317-3.635Z"
                stroke="url(#blitz-logo-b-0)"
                strokeWidth="2"
                fill="transparent"
              >
              </path>
              <defs>
                <linearGradient
                  id="blitz-logo-a-0"
                  x1="45.528"
                  y1="40.793"
                  x2="15.769"
                  y2="15.467"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#CE0F50"></stop>
                  <stop offset="1" stopColor="#FE112D"></stop>
                </linearGradient>
                <linearGradient
                  id="blitz-logo-b-0"
                  x1="28"
                  y1="0"
                  x2="28"
                  y2="64"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#FF003D"></stop>
                  <stop offset="1" stopColor="#FF003D" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
            </svg>
            <p className="text-medium text-muted-foreground">Blitz</p>
          </Button>
        </div>
      </div>
    </div>
  );
}
