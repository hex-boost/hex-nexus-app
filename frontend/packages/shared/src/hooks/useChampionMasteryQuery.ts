import type { LocalPlayerChampionMastery } from '@types';
import * as Summoner from '@summonerClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const CHAMPION_MASTERY_QUERY_KEY = ['champion-mastery'];

export function useChampionMasteryQuery() {
  const queryClient = useQueryClient();

  // For initial fetch and refetching
  const { data: championMastery, isLoading, error, refetch } = useQuery({
    queryKey: CHAMPION_MASTERY_QUERY_KEY,
    queryFn: Summoner.Client.GetChampionMastery,
  });

  // Function to update state from websocket
  const update = (websocketData: LocalPlayerChampionMastery[]) => {
    queryClient.setQueryData(CHAMPION_MASTERY_QUERY_KEY, websocketData);
  };

  return {
    championMastery,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: CHAMPION_MASTERY_QUERY_KEY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(CHAMPION_MASTERY_QUERY_KEY, null);
    },
    update, // Export to use with websocket
  };
}
