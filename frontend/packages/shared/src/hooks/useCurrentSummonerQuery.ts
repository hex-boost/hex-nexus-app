import type {CurrentSummoner} from '@types';
import * as Summoner from '@summonerClient';
import {useQuery, useQueryClient} from '@tanstack/react-query';

export const SUMMONER_QUERY_KEY = ['currentSummoner'];

export function useCurrentSummonerQuery() {
  const queryClient = useQueryClient();

  // For initial fetch and refetching
  const { data: currentSummoner, isLoading, error, refetch } = useQuery({
    queryKey: SUMMONER_QUERY_KEY,
    queryFn: Summoner.Client.GetCurrentSummoner,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Function to update state from websocket
  const update = (websocketData: CurrentSummoner) => {
    queryClient.setQueryData(SUMMONER_QUERY_KEY, websocketData);
  };

  // Connect this to your websocket listener elsewhere

  return {
    currentSummoner,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: SUMMONER_QUERY_KEY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(SUMMONER_QUERY_KEY, null);
    },
    update, // Export to use with websocket
  };
}
