import type { LobbySummonerCardProps } from '@/components/LobbySummonerCard.tsx';
import type { Server, TeamBuilderChampionSelect } from '@/types/types.ts';
import { useBlitzPlayerChampion } from '@/hooks/blitz/useBlitzPlayerChampion.ts';
import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { logger } from '@/lib/logger.ts';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

export function useLobbyRevealer({ platformId }: { platformId: string }) {
  const { allChampions, version } = useAllDataDragon();
  const [summonerCards, setSummonerCards] = useState<LobbySummonerCardProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper function to get champion data
  function getChampionData(championId: number) {
    if (!championId) {
      return null;
    }
    return allChampions.find(champion => Number(champion.id) === Number(championId));
  }

  // Get champion loading splash URL
  function getChampionLoadingUrl(championId: number, skinId: number | null): string | null {
    if (!championId) {
      return null;
    }

    const champion = getChampionData(championId);
    if (!champion) {
      return null;
    }

    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.name_id}_${skinId || 0}.jpg`;
  }

  // Get champion square image
  function getChampionSquareImage(championId: number): string | null {
    if (!championId || !version) {
      return null;
    }

    const champion = getChampionData(championId);
    if (!champion) {
      return null;
    }

    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.name_id}.png`;
  }

  useEffect(() => {
    // Initial loading state
    setIsLoading(true);

    const cancel = Events.On('OnJsonApiEvent_lol-lobby-team-builder_champ-select_v1', async (event) => {
      logger.info('CHAMPION_SELECT_UPDATE', {
        message: 'Received champion select update event',
        timestamp: new Date().toISOString(),
      });

      const champSelect = event.data[0] as TeamBuilderChampionSelect;
      if (!champSelect || !champSelect.myTeam) {
        logger.info('CHAMPION_SELECT_ERROR', {
          message: 'Invalid champion select data',
          data: event.data,
        });
        return;
      }

      // Process all players in my team
      const updatedCards = await Promise.all(champSelect.myTeam.map(async (summoner) => {
        // Only fetch detailed player data if we have all required information
        let playerChampionStats = null;
        try {
          if (summoner.gameName && summoner.tagLine) {
            const { playerChampion } = useBlitzPlayerChampion({
              gameName: summoner.gameName,
              tagLine: summoner.tagLine,
              region: platformId as Server,
            });

            playerChampionStats = playerChampion?.find(champion =>
              champion.champion_id === summoner.championId,
            );
          }
        } catch (error) {
          logger.error('PLAYER_CHAMPION_ERROR', {
            error,
            summoner: `${summoner.gameName}#${summoner.tagLine}`,
          });
        }

        // Determine champion information
        const championId = summoner.championId || summoner.championPickIntent;
        const championData = getChampionData(championId);

        // Create card data with available information
        return {
          summonerName: summoner.gameName || 'Player',
          summonerTag: summoner.tagLine || 'Unknown',
          assignedPosition: summoner.assignedPosition || '',
          championId,
          championName: championData?.name || 'Unknown',
          championSquareImage: getChampionSquareImage(championId),
          championLoadingImage: getChampionLoadingUrl(championId, summoner.selectedSkinId),
          isPickIntent: summoner.championId === 0 && summoner.championPickIntent > 0,
          isPicking: summoner.championId === 0,
          hasLocked: summoner.championId > 0,

          kills: playerChampionStats?.kills || 0,
          deaths: playerChampionStats?.deaths || 0,
          assists: playerChampionStats?.assists || 0,
          wins: playerChampionStats?.wins || 0,
          gamesPlayed: playerChampionStats?.game_count || 0,
          platformId,
        } as LobbySummonerCardProps;
      }));

      setSummonerCards(updatedCards);
      setIsLoading(false);

      logger.info('CHAMPION_SELECT_PROCESSED', {
        message: 'Processed champion select data',
        players: updatedCards.length,
        playerNames: updatedCards.map(card => card.summonerName),
      });
    });

    return () => {
      cancel();
      logger.info('CHAMPION_SELECT_LISTENER_REMOVED', {
        message: 'Champion select event listener removed',
      });
    };
  }, [platformId, allChampions, version]);

  return { summonerCards, isLoading };
}
