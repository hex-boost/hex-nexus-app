import type {CurrentSummoner} from '@types';
import * as Summoner from '@summonerClient';
import {useQuery, useQueryClient} from '@tanstack/react-query';

export const SUMMONER_RANK_QUERY = ['summoner-rank'];

export function useSummonerRankQuery() {
  const queryClient = useQueryClient();

  // For initial fetch and refetching
  const { data: currentSummonerRank, isLoading, error, refetch } = useQuery({
    queryKey: SUMMONER_RANK_QUERY,
    queryFn: Summoner.Client.GetRanking,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Function to update state from websocket
  const update = (websocketData: CurrentSummoner) => {
    queryClient.setQueryData(SUMMONER_RANK_QUERY, websocketData);
  };

  return {
    currentSummonerRank,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: SUMMONER_RANK_QUERY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(SUMMONER_RANK_QUERY, null);
    },
    update, // Export to use with websocket
  };
}
