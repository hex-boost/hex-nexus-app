import {Avatar, AvatarImage} from '@/components/ui/avatar.tsx';
import {Badge} from '@/components/ui/badge.tsx';
import {Button} from '@/components/ui/button.tsx';
import {useMapping} from '@/lib/useMapping.tsx';
import {createFileRoute} from '@tanstack/react-router';
import {ExternalLink} from 'lucide-react';

export const Route = createFileRoute('/_protected/active-game/')({
  component: RouteComponent,
});

function RouteComponent() {
  // const { user } = useUserStore();
  // const { currentRanking } = useRiotAccount({ account: user?.rentedAccounts[0] });
  const { getEloIcon } = useMapping();
  return (
    <>
      <div className="flex justify-between pb-6 items-center w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold ">Current Lobby</h1>
          <Badge
            variant="outline"
            className="py-1 px-3  rounded-full border-emerald-500/50 bg-emerald-500/10 "
          >
            <div className="h-2 w-2 bg-emerald-300 animate-pulse rounded-full "></div>
            <span className="text-emerald-500">Lobby</span>
          </Badge>
        </div>
        <Button>

          <img
            src="https://s-opgg-kit.op.gg/gnb/config/images/icon/bfa5abe2f78d6e9a55e81c9988c31442.svg?image=q_auto:good,f_webp,w_48,h_48"
            width="24"
            height="24"
            alt=""
            loading="lazy"
          />
          Multi Opgg
          <ExternalLink className="ml-2" size={16} />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="relative max-w-xs aspect-[3/4] bg-white/5 overflow-hidden rounded-xl"
          >
            <img
              alt="aatrox"
              className="absolute top-0 w-full object-contain object-top z-0 transition-transform duration-300 rounded-lg scale-105"
              src="https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Aatrox_20.jpg"
            />
            <div
              className="absolute inset-0 z-10 bg-gradient-to-t from-card from-40% to-transparent transition-opacity duration-300"
            />

            {/* Centered content */}
            <div className="relative z-20 h-full flex flex-col items-center justify-end">
              <p className="text-xl font-bold">
                AYordle
                {' '}
                <span className="text-muted-foreground">#Yuumi</span>
              </p>

              <p className="text-muted-foreground font-light text-xs uppercase">Aatrox</p>

              {/* Stats section - properly positioned within the card */}
              <div className="flex gap-4 items-center mt-4">
                <Avatar className="rounded-md">
                  <AvatarImage
                    className="scale-110"
                    alt="flash"
                    src="https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/Aatrox.png"
                  />
                </Avatar>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-blue-500 text-xs">
                    54%
                  </p>
                  <p className="text-xs text-muted-foreground">45 played</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <p className="font-medium text-xs text-orange-200">
                    1.82
                    {' '}
                    <span className="text-xs text-muted-foreground">KDA</span>
                  </p>
                  <p className="text-xs">3 / 5.8/ 15.2</p>
                </div>
              </div>
              <RankCard
                title="Ranqueada Solo"
                rank="Bronze 2"
                points={89}
                pointsLabel="PDL"
                winPercentage={30.8}
                victories={20}
                defeats={45}
                badgeUrl={getEloIcon('bronze')}
              />
              {' '}
              {/* <GameRankDisplay ranking={currentRanking} /> */}
              <div className="flex gap-2 px-4 w-full py-2">
                <Button variant="custom" className="bg-white/[0.01] gap-2 w-full hover:bg-white/[0.02] py-2">
                  <img
                    src="https://s-opgg-kit.op.gg/gnb/config/images/icon/bfa5abe2f78d6e9a55e81c9988c31442.svg?image=q_auto:good,f_webp,w_48,h_48"
                    width="24"
                    height="24"
                    alt=""
                    loading="lazy"
                  />
                  <p className="text-medium text-muted-foreground">Opgg</p>
                </Button>
                <Button variant="custom" className="bg-white/[0.01] w-full hover:bg-white/[0.02] py-2 gap-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 -8 56 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="original-colors"
                  >
                    <path
                      d="M24.13 64c-2.578 0-4.587-2.21-4.312-4.742l1.95-17.993A1.148 1.148 0 0 0 20.618 40H5.847a2.324 2.324 0 0 1-1.762-.805L2.55 37.412a2.265 2.265 0 0 1-.068-2.878L29.321.222A.58.58 0 0 1 29.778 0h2.046c2.577 0 4.586 2.21 4.311 4.742l-1.95 17.993A1.148 1.148 0 0 0 35.335 24h14.784c.672 0 1.31.289 1.75.791l1.568 1.794c.72.823.753 2.034.079 2.894l-26.884 34.3a.58.58 0 0 1-.457.221h-2.046Z"
                      fill="url(#blitz-logo-a-0)"
                    >
                    </path>
                    <path
                      d="m20.812 59.365 1.95-17.993c.14-1.28-.874-2.372-2.143-2.372H5.846c-.39 0-.756-.17-1.004-.457L3.309 36.76a1.265 1.265 0 0 1-.038-1.61L29.98 1h1.843c1.995 0 3.526 1.706 3.317 3.635l-1.95 17.993c-.14 1.28.874 2.372 2.143 2.372H50.12c.385 0 .749.166.997.45l1.568 1.793c.404.462.422 1.137.045 1.62L25.972 63h-1.843c-1.995 0-3.526-1.706-3.317-3.635Z"
                      stroke="url(#blitz-logo-b-0)"
                      stroke-width="2"
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
                        <stop stop-color="#CE0F50"></stop>
                        <stop offset="1" stop-color="#FE112D"></stop>
                      </linearGradient>
                      <linearGradient
                        id="blitz-logo-b-0"
                        x1="28"
                        y1="0"
                        x2="28"
                        y2="64"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stop-color="#FF003D"></stop>
                        <stop offset="1" stop-color="#FF003D" stop-opacity="0"></stop>
                      </linearGradient>
                    </defs>
                  </svg>

                  <p className="text-medium text-muted-foreground">

                    Blitz
                  </p>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

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

export default function RankCard({
  title = 'Ranqueada Solo',
  rank = 'Bronze 2',
  points = 89,
  pointsLabel = 'PDL',
  winPercentage = 30.8,
  victories = 20,
  defeats = 45,
  badgeUrl = '/bronze-badge.png',
}: RankCardProps) {
  // Calculate progress percentage based on points (assuming 100 is max for simplicity)
  // You can adjust this calculation based on your actual requirements
  const progressPercentage = Math.min(points, 100);

  return (
    <div className="w-full max-w-xs rounded-md p-4 text-white shadow-md">

      <div className="flex gap-4 items-center">
        {badgeUrl && (
          <div className="">
            <img
              src={badgeUrl || '/placeholder.svg'}
              alt={`${rank} badge`}
              height={60}
              width={60}
            />
          </div>
        )}
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
              {defeats}
              D
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
