import type { LobbySummonerCardProps } from '@/components/LobbySummonerCard.tsx';
import type { Server } from '@/types/types.ts';
import { LobbySummonerCard } from '@/components/LobbySummonerCard.tsx';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useLobbyRevealer } from '@/features/lobby-revealer/hooks/useLobbyRevealer.ts';
import { SummonerCardEmptyState } from '@/features/lobby-revealer/SummonerCardEmptyState.tsx';
import { SummonerCardSkeleton } from '@/features/lobby-revealer/SummonerCardSkeleton.tsx';
import { useBlitzPlayerChampion } from '@/hooks/blitz/useBlitzPlayerChampion.ts';
import { useChampionMasteryQuery } from '@/hooks/useChampionMasteryQuery.ts';
import { useChatMeQuery } from '@/hooks/useChatMeQuery.ts';
import { useCurrentSummonerProfileQuery } from '@/hooks/useCurrentSummonerProfileQuery.ts';
import { useCurrentSummonerQuery } from '@/hooks/useCurrentSummonerQuery.ts';
import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { useGameflowPhase } from '@/hooks/useGameflowPhaseQuery.ts';
import { useSummonerRankQuery } from '@/hooks/useSummonerRankQuery.ts';
import { logger } from '@/lib/logger.ts';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Debug logging helper function
function getChampionSquareImage(champion_id?: string, version?: string) {
  return (champion_id && version)
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion_id}.png`
    : 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
}

export function LobbyRevealerPage() {
  // Track component renders
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    logger.info('COMPONENT', {
      message: 'Component rendered',
      renderCount: renderCount.current,
      timestamp: new Date().toISOString(),
    });
  });

  // ===== Data Hooks =====
  const { version, allChampions, isLoading: isDataDragonLoading } = useAllDataDragon();
  const { gameflowPhase, isLoading: isGameflowLoading } = useGameflowPhase();
  const { currentSummonerProfile, isLoading: isProfileLoading } = useCurrentSummonerProfileQuery();
  const { currentSummonerRank, isLoading: isRankLoading } = useSummonerRankQuery();
  const { chatMe, isLoading: isChatMeLoading } = useChatMeQuery();
  const { currentSummoner, isLoading: isSummonerLoading } = useCurrentSummonerQuery();
  const { championMastery, isLoading: isChampionMasteryLoading } = useChampionMasteryQuery();

  // Debug logging for hooks loading states
  useEffect(() => {
    logger.info('LOADING_STATES', {
      isDataDragonLoading,
      isGameflowLoading,
      isProfileLoading,
      isRankLoading,
      isChatMeLoading,
      isSummonerLoading,
      allLoading: isDataDragonLoading || isGameflowLoading || isProfileLoading
        || isRankLoading || isChatMeLoading || isSummonerLoading,
    });
  }, [
    isDataDragonLoading,
    isGameflowLoading,
    isProfileLoading,
    isRankLoading,
    isChatMeLoading,
    isSummonerLoading,
  ]);

  // Debug logging for fetched data
  useEffect(() => {
    logger.info('DATA_DRAGON', {
      version,
      championsCount: allChampions?.length,
      firstChampion: allChampions?.[0],
      isLoaded: !isDataDragonLoading,
    });
  }, [version, allChampions, isDataDragonLoading]);

  useEffect(() => {
    logger.info('GAMEFLOW', {
      phase: gameflowPhase?.phase,
      isLoaded: !isGameflowLoading,
    });
  }, [gameflowPhase, isGameflowLoading]);

  useEffect(() => {
    logger.info('SUMMONER_PROFILE', {
      profile: currentSummonerProfile,
      backgroundSkinId: currentSummonerProfile?.backgroundSkinId,
      isLoaded: !isProfileLoading,
    });
  }, [currentSummonerProfile, isProfileLoading]);

  useEffect(() => {
    logger.info('SUMMONER_RANK', {
      rank: currentSummonerRank,
      soloQueue: currentSummonerRank?.RANKED_SOLO_5x5,
      isLoaded: !isRankLoading,
    });
  }, [currentSummonerRank, isRankLoading]);

  useEffect(() => {
    logger.info('CHAT_ME', {
      data: chatMe,
      platformId: chatMe?.platformId,
      gameName: chatMe?.gameName,
      gameTag: chatMe?.gameTag,
      isLoaded: !isChatMeLoading,
    });
  }, [chatMe, isChatMeLoading]);

  useEffect(() => {
    logger.info('CURRENT_SUMMONER', {
      summoner: currentSummoner,
      gameName: currentSummoner?.gameName,
      tagLine: currentSummoner?.tagLine,
      isLoaded: !isSummonerLoading,
    });
  }, [currentSummoner, isSummonerLoading]);

  // Only fetch player champion when we have all required data
  const gameName = currentSummoner?.gameName || chatMe?.gameName || '';
  const tagLine = currentSummoner?.tagLine || chatMe?.gameTag || '';
  const region = chatMe?.platformId as Server || '';

  const { } = useLobbyRevealer();
  // Log derived properties
  useEffect(() => {
    logger.info('DERIVED_PROPS', {
      gameName,
      tagLine,
      region,
      hasAllRequired: !!gameName && !!tagLine && !!region,
    });
  }, [gameName, tagLine, region]);

  // Then use the hook with those values and a better enabled condition
  const { playerChampion, isLoading: isChampionLoading } = useBlitzPlayerChampion({
    gameName,
    tagLine,
    region,
    queryOptions: {
      enabled: !!gameName && !!tagLine && !!region,
    },
  });

  // Log player champion data
  useEffect(() => {
    logger.info('PLAYER_CHAMPION', {
      data: playerChampion,
      championCount: playerChampion?.length,
      firstChampion: playerChampion?.[0],
      isLoaded: !isChampionLoading,
      params: { gameName, tagLine, region },
    });
  }, [playerChampion, isChampionLoading, gameName, tagLine, region]);

  const getBackgroundImageUrl = (backgroundSkinId: number) => {
    if (!backgroundSkinId || !version) {
      logger.info('BACKGROUND_IMAGE', {
        error: 'Missing required data',
        backgroundSkinId,
        version,
      });
      return null;
    }

    // Convert to string for easier manipulation
    const skinIdStr = backgroundSkinId.toString();

    // Extract champion ID and skin number
    const championId = skinIdStr?.slice(0, -3);
    const skinNum = skinIdStr?.slice(-3).replace(/^0+/, '') || '0'; // Remove leading zeros

    // Log skin ID parsing
    logger.info('SKIN_ID_PARSING', {
      backgroundSkinId,
      skinIdStr,
      championId,
      skinNum,
    });

    // Find champion name from ID
    const championName = allChampions.find(champion =>
      Number(champion.id) === Number(championId))?.name_id;

    if (!championName) {
      logger.info('BACKGROUND_IMAGE', {
        error: 'Champion not found',
        championId,
        allChampionsCount: allChampions.length,
      });
      return null;
    }

    const url = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championName}_${skinNum}.jpg`;

    logger.info('BACKGROUND_IMAGE', {
      success: true,
      championId,
      championName,
      skinNum,
      url,
    });

    return url;
  };
  // Helper function to get background image URL

  const { data: summonerCard, isLoading: isCardLoading } = useQuery({
    queryKey: ['summonerCard', currentSummoner?.gameName, currentSummoner?.tagLine],
    queryFn: async () => {
      logger.info('SUMMONER_CARD_QUERY', {
        message: 'Starting summoner card query function',
        currentSummoner: currentSummoner?.gameName,
        hasRank: !!currentSummonerRank,
        hasChampion: !!playerChampion?.length,
      });

      const playerChampionUnique = playerChampion && playerChampion.length > 0
        ? playerChampion.reduce((mostPlayed, current) =>
            (current.match_ids?.length || 0) > (mostPlayed?.match_ids?.length || 0)
              ? current
              : mostPlayed, playerChampion[0])
        : null;
      const backgroundImageUrl = currentSummonerProfile && currentSummonerProfile.backgroundSkinId !== 0
        ? getBackgroundImageUrl(currentSummonerProfile.backgroundSkinId)
        : (() => {
            // Find champion with highest mastery points
            const highestMasteryChampion = championMastery?.reduce(
              (highest, current) =>
                (current.championPoints > highest.championPoints) ? current : highest,
              championMastery[0],
            );

            // Find matching data dragon champion and get skin URL
            return highestMasteryChampion
              ? allChampions.find(dragonChampion => highestMasteryChampion.championId === Number(dragonChampion.id))?.skins[0].imageAvatarUrl
              : null;
          })();

      logger.info('SUMMONER_CARD_DATA', {
        playerChampion,
        backgroundImageUrl,
        summonerName: currentSummoner?.gameName,
        rank: currentSummonerRank?.RANKED_SOLO_5x5?.tier,
      });

      const dataDragonChampion = allChampions.find(dragonChampion => playerChampionUnique?.champion_id?.toString() === dragonChampion?.id?.toString().toLowerCase());
      const championSquareImage = getChampionSquareImage(dataDragonChampion?.name_id, version);
      const card = {
        platformId: chatMe?.platformId,
        championSquareImage,
        summonerName: currentSummoner?.gameName || 'Unknown',
        summonerTag: currentSummoner?.tagLine || 'N/A',
        championLoadingImage: backgroundImageUrl || '',
        championName: dataDragonChampion?.name || '',
        kills: playerChampionUnique?.kills || 0,
        allChampions,
        version,
        deaths: playerChampionUnique?.deaths || 0,
        assists: playerChampionUnique?.assists || 0,
        rank: `${currentSummonerRank?.RANKED_SOLO_5x5?.tier || 'unranked'}`,
        division: currentSummonerRank?.RANKED_SOLO_5x5?.division || '4',
        rankPoints: currentSummonerRank?.RANKED_SOLO_5x5?.leaguePoints || 0,
        victories: currentSummonerRank?.RANKED_SOLO_5x5?.wins || 0,
        defeats: currentSummonerRank?.RANKED_SOLO_5x5?.losses || 0,
        wins: playerChampionUnique?.wins || 0,
        gamesPlayed: playerChampionUnique?.game_count || 0,
      } as LobbySummonerCardProps;

      logger.info('SUMMONER_CARD_CREATED', card);
      return card;
    },
    enabled: !isSummonerLoading
      && !isProfileLoading
      && !isRankLoading
      && !isChampionLoading
      && !isDataDragonLoading && !isChampionMasteryLoading,
  });

  // Log query info
  useEffect(() => {
    logger.info('SUMMONER_CARD_QUERY_STATUS', {
      isLoading: isCardLoading,
      hasData: !!summonerCard,
      enabled: !isSummonerLoading
        && !isProfileLoading
        && !isRankLoading
        && !isChampionLoading
        && !isDataDragonLoading,
    });
  }, [
    summonerCard,
    isCardLoading,
    isSummonerLoading,
    isProfileLoading,
    isRankLoading,
    isChampionLoading,
    isDataDragonLoading,
  ]);

  // Combined loading state
  const isLoading
        = isSummonerLoading || isChampionMasteryLoading
          || isProfileLoading
          || isRankLoading
          || isChampionLoading
          || isDataDragonLoading
          || isCardLoading;

  // Create an array for 5 player positions
  const allPlayers = Array.from({ length: 5 }).fill(null);

  // Place current summoner card in the middle position if available
  if (summonerCard && !isLoading) {
    allPlayers[2] = summonerCard;
    logger.info('PLAYERS_ARRAY', {
      message: 'Setting current summoner in middle position',
      summonerName: summonerCard.summonerName,
      position: 2,
    });
  } else {
    logger.info('PLAYERS_ARRAY', {
      message: 'No summoner card available to set in players array',
      isLoading,
      hasSummonerCard: !!summonerCard,
    });
  }

  // Log final state before render
  useEffect(() => {
    logger.info('RENDER_STATE', {
      isLoading,
      phase: gameflowPhase?.phase,
      playersCount: allPlayers.filter(Boolean).length,
      summonerCard: summonerCard
        ? {
            name: summonerCard.summonerName,
            tag: summonerCard.summonerTag,
            rank: summonerCard.rank,
            division: summonerCard.division,
          }
        : null,
    });
  }, [isLoading, gameflowPhase, allPlayers, summonerCard]);

  return (
    <>
      <div className="flex justify-between pb-6 items-center w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold">Current Lobby</h1>
          {isGameflowLoading
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
        <Button onClick={() => logger.info('BUTTON_CLICK', { action: 'Multi Opgg button clicked' })}>
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
        {Array.from({ length: 5 }).map((_, index) => {
          // Current user's position is in the middle (index 2)
          if (index === 2 && isLoading) {
            logger.info('RENDERING_PLAYER', { index, position: 'middle', type: 'skeleton', reason: 'loading current user' });
            return <SummonerCardSkeleton key={`current-${index}`} />;
          }

          // If this is the middle position and we have current user data
          if (index === 2 && summonerCard) {
            logger.info('RENDERING_PLAYER', {
              index,
              type: 'current user card',
              summonerName: summonerCard.summonerName,
              summonerTag: summonerCard.summonerTag,
            });
            return (
              <LobbySummonerCard
                key={`current-${summonerCard.summonerName}-${summonerCard.summonerTag}`}
                {...summonerCard}
              />
            );
          }

          // For other positions, check if we have lobby data for this position
          // const lobbyPlayer = summonerCards[index < 2 ? index : index - 1];

          // If we're loading other players data, show skeleton
          if (index !== 2) {
            logger.info('RENDERING_PLAYER', { index, type: 'skeleton', reason: 'loading other players' });
            return <SummonerCardSkeleton key={`lobby-loading-${index}`} />;
          }

          // If we have lobby data for this position
          // In LobbyRevealerPage component
          // { lobbyPlayer
          //   ? (
          //       <LobbySummonerCard
          //         key={`lobby-${lobbyPlayer.summonerName}-${lobbyPlayer.summonerTag}`}
          //         {...lobbyPlayer}
          //       />
          //     )
          //   : (
          //       <div className="bg-neutral-900 rounded-lg p-4 text-center">
          //         <p className="text-neutral-400 text-sm">Waiting for pick...</p>
          //       </div>
          //     ); }
          // Otherwise show empty state
          logger.info('RENDERING_PLAYER', { index, type: 'empty', reason: 'no player data' });
          return <SummonerCardEmptyState key={`empty-${index}`} />;
        })}
      </div>
    </>
  );
}
