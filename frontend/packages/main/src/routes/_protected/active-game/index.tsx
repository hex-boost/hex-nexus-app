import type {PlayerChampion} from '@/hooks/blitz/types/PlayerChampion.ts';
import type {Server} from '@/types/types.ts';
import {LobbySummonerCard} from '@/components/LobbySummonerCard.tsx';

import {Badge} from '@/components/ui/badge.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Skeleton} from '@/components/ui/skeleton.tsx';
import {useBlitzPlayerChampion} from '@/hooks/blitz/useBlitzPlayerChampion.ts';
import {useChatMeQuery} from '@/hooks/useChatMeQuery.ts';
import {useCurrentSummonerProfileQuery} from '@/hooks/useCurrentSummonerProfileQuery.ts';
import {useCurrentSummonerQuery} from '@/hooks/useCurrentSummonerQuery.ts';
import {useAllDataDragon} from '@/hooks/useDataDragon/useDataDragon.ts';
import {useGameflowPhase} from '@/hooks/useGameflowPhaseQuery.ts';
import {useSummonerRankQuery} from '@/hooks/useSummonerRankQuery.ts';
import {useMapping} from '@/lib/useMapping.tsx';
import {createFileRoute} from '@tanstack/react-router';
import {Browser} from '@wailsio/runtime';
import {ExternalLink} from 'lucide-react';

export const Route = createFileRoute('/_protected/active-game/')({
  component: RouteComponent,
});

const SummonerCardSkeleton = () => (
  <div className="border rounded-md p-4 w-full">
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>
    </div>
    <Skeleton className="h-[140px] w-full mb-4" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// Creating the empty state component since it's not defined in the provided code
function EmptyLobbySummonerCard() {
  return (
    <div className="relative max-w-xs aspect-[3/4] bg-card overflow-hidden rounded-xl flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-card from-40% to-transparent" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="text-4xl mb-3 text-muted-foreground">?</div>
        <p className="font-medium">No Summoner</p>
        <p className="text-sm text-muted-foreground mt-1">
          Waiting for summoner to join...
        </p>
      </div>
    </div>
  );
}
function RouteComponent() {
  const { getEloIcon } = useMapping();
  const { version, allChampions, isLoading: isDataDragonLoading } = useAllDataDragon();
  const { gameflowPhase, isLoading: isGameflowLoading } = useGameflowPhase();
  const { currentSummoner, isLoading: isSummonerLoading } = useCurrentSummonerQuery();
  const { currentSummonerProfile } = useCurrentSummonerProfileQuery();
  const { chatMe, isLoading: isChatLoading } = useChatMeQuery();
  const { currentSummonerRank, isLoading: isRankLoading } = useSummonerRankQuery();

  // Only fetch player champion when we have all required data
  const { playerChampion, isLoading: isChampionLoading } = useBlitzPlayerChampion({
    gameName: currentSummoner?.gameName || '',
    tagLine: currentSummoner?.tagLine || '',
    region: chatMe?.platformId as Server || '',
  });

  // Combined loading state
  const isLoading = {
    dataDragon: isDataDragonLoading,
    gameflow: isGameflowLoading,
    summoner: isSummonerLoading,
    chat: isChatLoading,
    rank: isRankLoading,
    champion: isChampionLoading,
  };

  const anyLoading = Object.values(isLoading).some(loading => loading);

  const getBackgroundImageUrl = (backgroundSkinId: number) => {
    if (!backgroundSkinId || !version) {
      return null;
    }

    // Convert to string for easier manipulation
    const skinIdStr = backgroundSkinId.toString();

    // Extract champion ID and skin number
    const championId = skinIdStr.slice(0, -3);
    const skinNum = skinIdStr.slice(-3).replace(/^0+/, '') || '0'; // Remove leading zeros

    // You need a mapping from champion IDs to champion names
    // This would ideally come from your DataDragon data
    const championName = allChampions.find(champion => Number(champion.id) === Number(championId))?.name_id;

    if (!championName) {
      return null;
    }

    // Return either splash art (fullscreen) or loading art (champion card)
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${skinNum}.jpg`;
  };

  function calculateWinPercentage(rankData: any) {
    const wins = rankData?.RANKED_SOLO_5x5?.wins || 0;
    const losses = rankData?.RANKED_SOLO_5x5?.losses || 0;
    return wins + losses > 0 ? (wins / (wins + losses) * 100) : 0;
  }

  const calculateKDA = (champion: PlayerChampion | undefined) => {
    if (!champion) {
      return 0;
    }
    return champion.deaths > 0
      ? ((champion.kills + champion.assists) / champion.deaths).toFixed(2)
      : (champion.kills + champion.assists).toFixed(2);
  };

  // Create a champion variable to simplify access and checks
  const champion = playerChampion && playerChampion?.length > 0 ? playerChampion[0] : null;
  const currentSummonerCard = {
    summonerName: 'NinjaWarrior',
    summonerTag: 'NA1',
    championLoadingImage: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg',
    championSquareImage: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png',
    championName: 'Yasuo',
    winRate: 54.3,
    gamesPlayed: 128,
    kda: 2.75,
    kills: 7.2,
    deaths: 5.1,
    assists: 6.8,
    rank: 'Platinum 2',
    rankPoints: 67,
    rankPointsLabel: 'PDL',
    winPercentage: 51.2,
    victories: 83,
    defeats: 79,
    rankIcon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/platinum.png',
  };
  // const currentSummonerCard = {
  //   summonerName: currentSummoner?.gameName || 'YourSummoner',
  //   summonerTag: currentSummoner?.tagLine || 'TAG',
  //   championLoadingImage: (currentSummonerProfile ? getBackgroundImageUrl(currentSummonerProfile.backgroundSkinId) : '') || '',
  //   championSquareImage: champion && version
  //     ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.champion_id}.png`
  //     : 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png',
  //   championName: champion?.champion_id?.toString() || 'N/A',
  //   winRate: champion?.wins && champion.game_count ? (champion.wins / champion.game_count * 100) : 0,
  //   gamesPlayed: champion?.game_count || 0,
  //   kda: champion ? Number(calculateKDA(champion)) : 0.00,
  //   kills: champion?.kills || 0,
  //   deaths: champion?.deaths || 0,
  //   assists: champion?.assists || 0,
  //   rank: `${currentSummonerRank?.RANKED_SOLO_5x5?.tier || 'Gold'} ${currentSummonerRank?.RANKED_SOLO_5x5?.division || '4'}`,
  //   rankPoints: currentSummonerRank?.RANKED_SOLO_5x5?.leaguePoints || 0,
  //   rankPointsLabel: 'PDL',
  //   winPercentage: calculateWinPercentage(currentSummonerRank),
  //   victories: currentSummonerRank?.RANKED_SOLO_5x5?.wins || 0,
  //   defeats: currentSummonerRank?.RANKED_SOLO_5x5?.losses || 0,
  //   rankIcon: getEloIcon((currentSummonerRank?.RANKED_SOLO_5x5?.tier || 'unranked').toLowerCase()),
  // };

  // Create an array for 5 player positions
  // Initialize with null values - we'll fill in actual data later
  const allPlayers = Array.from({ length: 5 }).fill(null);

  // Place current summoner in the middle position (index 2)
  // allPlayers[2] = anyLoading ? null : currentSummonerCard;
  allPlayers[2] = currentSummonerCard;

  // In a real scenario, you would populate other player data here
  // For now we'll leave them as null, which will render as empty cards

  // Example of how to populate other players (in a real scenario):
  // const otherPlayers = [...]; // Your data for other players in lobby
  //
  // // Place other players in alternating positions around the middle
  // let leftIndex = 1; // Position to the left of center
  // let rightIndex = 3; // Position to the right of center
  //
  // otherPlayers.forEach(player => {
  //   if (leftIndex >= 0) {
  //     allPlayers[leftIndex] = player;
  //     leftIndex--;
  //   } else if (rightIndex < 5) {
  //     allPlayers[rightIndex] = player;
  //     rightIndex++;
  //   }
  // });

  // Skeleton loader for the card

  return (
    <>
      <div className="flex justify-between pb-6 items-center w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold">Current Lobby</h1>
          {isLoading.gameflow
            ? (
                <Skeleton className="h-6 w-24 rounded-full" />
              )
            : (
                <Badge
                  variant="outline"
                  className="py-1 px-3 rounded-full border-emerald-500/50 bg-emerald-500/10"
                >
                  <div className="h-2 w-2 bg-emerald-300 animate-pulse rounded-full"></div>
                  <span className="text-emerald-500">{gameflowPhase?.phase || 'Idle'}</span>
                </Badge>
              )}
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
        {allPlayers.map((player: any, index) => {
          // If any data is loading, show skeleton for all cards
          // if (anyLoading) {
          //   return <SummonerCardSkeleton key={index} />;
          // }

          // If we have player data, render the card
          if (player) {
            return (
              <LobbySummonerCard
                key={index}
                {...player}
                onOpenOpgg={() => Browser.OpenURL(`https://op.gg/summoner/userName=${player.summonerName}`)}
                onOpenBlitz={() => Browser.OpenURL(`https://blitz.gg/lol/profile/${player.summonerName}`)}
              />
            );
          }

          // Otherwise show empty state
          return <EmptyLobbySummonerCard key={index} />;
        })}
      </div>
    </>
  );
}
