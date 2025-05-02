import type { LobbySummonerCardProps } from '@/components/LobbySummonerCard.tsx';
import type { PlayerChampion } from '@/hooks/blitz/types/PlayerChampion.ts';
import type { Server, TeamBuilderChampionSelect } from '@/types/types.ts';
import { fetchRiotAccount } from '@/hooks/blitz/useBlitzRiotAccount.ts';
import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Events } from '@wailsio/runtime';
import axios from 'axios';
import { useEffect } from 'react';

export function useLobbyRevealer({ platformId }: { platformId: string }) {
  const { allChampions, version } = useAllDataDragon();
  const queryClient = useQueryClient();

  // Query key for caching summoner cards
  const summonerCardsKey = ['summonerCards', platformId];

  // Helper functions for champion data
  function getChampionData(championId: number) {
    if (!championId) {
      return null;
    }
    return allChampions.find(champion => Number(champion.id) === Number(championId));
  }

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

  // Mutation for processing champion select data
  const { mutate: processSummonerCards, isPending } = useMutation({
    mutationFn: async (champSelect: TeamBuilderChampionSelect) => {
      if (!champSelect || !champSelect.myTeam) {
        return;
      }

      // Process all players in my team
      const playerDataPromises = champSelect.myTeam.map(async (summoner) => {
        // Get player data
        const blitzRiotAccount = await fetchRiotAccount({
          gameName: summoner.gameName,
          tagLine: summoner.tagLine,
          platformId: platformId as Server,
        });

        const playerKey = summoner.gameName && summoner.tagLine
          ? `${summoner.gameName}#${summoner.tagLine}`
          : null;

        let playerChampionStats: PlayerChampion | null = null;

        // Fetch player champion stats if we have a name and tag
        if (playerKey) {
          try {
            const response = await axios.get(
              `https://lol.iesdev.com/lol/player_champion_aggregate/${platformId}/${summoner.gameName}/${summoner.tagLine}/420`,
            );
            const playerChampions = response.data;
            playerChampionStats = playerChampions?.find(champion =>
              champion.champion_id === summoner.championId,
            ) || null;
          } catch (error) {
            console.error('Error fetching player champion data', error);
          }
        }

        const playerRank = blitzRiotAccount?.league_lol.find(
          league => league.queue_type === 'RANKED_SOLO_5x5',
        );
        const championIdToUse = summoner.championId || summoner.championPickIntent;
        const champion = getChampionData(championIdToUse);
        // Create card data with available information
        return {
          summonerName: summoner.gameName || 'Player',
          summonerTag: summoner.tagLine || 'Unknown',
          championName: champion?.name || 'Unknown',
          championSquareImage: getChampionSquareImage(Number(champion?.id)),
          championLoadingImage: getChampionLoadingUrl(Number(champion?.id), summoner.selectedSkinId),
          rank: playerRank?.tier,
          division: playerRank?.rank,
          rankPoints: playerRank?.league_points,
          victories: 0,
          defeats: 0,
          kills: playerChampionStats?.kills || 0,
          deaths: playerChampionStats?.deaths || 0,
          assists: playerChampionStats?.assists || 0,
          wins: playerChampionStats?.wins || 0,
          gamesPlayed: playerChampionStats?.game_count || 0,
          platformId,
        } as LobbySummonerCardProps;
      });

      const summonerCards = await Promise.all(playerDataPromises);
      return summonerCards.filter(Boolean) as LobbySummonerCardProps[];
    },
    onSuccess: (data) => {
      // Update the cache when successful
      queryClient.setQueryData(summonerCardsKey, data);
    },
  });

  // Register event listener
  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-lobby-team-builder_champ-select_v1', (event) => {
      console.log('lol-lobby-team-builder_champ-select_v1', event.data[0]);
      const champSelect = event.data[0] as TeamBuilderChampionSelect;

      processSummonerCards(champSelect);
    });

    return () => cancel();
  }, [platformId, allChampions, version, processSummonerCards]);

  // Get the current summoner cards from cache
  const summonerCards = queryClient.getQueryData<LobbySummonerCardProps[]>(summonerCardsKey) || [];

  return { summonerCards, isPending };
}
