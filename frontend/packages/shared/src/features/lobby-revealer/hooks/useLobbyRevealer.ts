import type { Server, TeamBuilderChampionSelect } from '@/types/types.ts';
import { LolChallengesGameflowPhase, useGameflowPhase } from '@/hooks/useGameflowPhaseQuery.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Events } from '@wailsio/runtime';
import { useEffect, useMemo } from 'react';

export function useLobbyRevealer({ platformId }: { platformId: string }) {
  const queryClient = useQueryClient();
  const { gameflowPhase } = useGameflowPhase();
  const { getFormattedServer } = useMapping();

  const summonerCardsKey = useMemo(() => ['summonerCards'], []);

  const { data, mutate: processSummonerCards, isPending } = useMutation({
    mutationFn: async (champSelect: TeamBuilderChampionSelect) => {
      return champSelect.myTeam.map(myTeam => `${myTeam.gameName.trim()}#${myTeam.tagLine.trim()}`);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(summonerCardsKey, data);
    },
  });
  useEffect(() => {
    if (gameflowPhase && gameflowPhase.phase !== LolChallengesGameflowPhase.ChampSelect) {
      console.log('[useLobbyRevealer] Gameflow phase changed to non-ChampSelect, clearing summoner cards');
      queryClient.setQueryData(summonerCardsKey, null);
    }
  }, [gameflowPhase, queryClient, summonerCardsKey]);

  function getMultiSearchUrl(summonerCards: string[]): string {
    const region = getFormattedServer(platformId as Server);

    const summonerList = summonerCards
      .map((card) => {
        return encodeURIComponent(card);
      })
      .join('%2C');

    return `https://op.gg/lol/multisearch/${region.toLowerCase()}?summoners=${summonerList}`;
  }
  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-lobby-team-builder_champ-select_v1', (event) => {
      console.log('lol-lobby-team-builder_champ-select_v1_session', event.data[0]);
      const champSelect = event.data[0] as TeamBuilderChampionSelect;

      if (!champSelect || !champSelect.myTeam) {
        return;
      }
      processSummonerCards(champSelect);
    });

    return () => cancel();
  }, [processSummonerCards]);

  return { summonerCards: data, isPending, getMultiSearchUrl };
}
