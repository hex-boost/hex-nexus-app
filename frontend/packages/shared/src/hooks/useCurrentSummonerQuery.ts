import type { CurrentSummoner } from '@types';
import { useLeagueState } from '@/hooks/useLeagueState.tsx';
import { LeagueClientStateType } from '@league';
import * as Summoner from '@summonerClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export function useCurrentSummonerQuery() {
  const { state } = useLeagueState();
  const SUMMONER_QUERY_KEY = ['active-game', 'current-summoner'];
  const queryClient = useQueryClient();
  const previousStateRef = useRef<LeagueClientStateType | undefined>(undefined);

  // For initial fetch and refetching
  const { data: currentSummoner, isLoading, error, refetch } = useQuery({
    queryKey: SUMMONER_QUERY_KEY,
    queryFn: Summoner.Client.GetCurrentSummoner,
    enabled: state?.clientState === LeagueClientStateType.ClientStateLoggedIn,
  });

  // Watch for client state changes
  useEffect(() => {
    const currentState = state?.clientState;

    // When state changes to LOGGED_IN from another state, invalidate the query
    if (currentState !== LeagueClientStateType.ClientStateLoggedIn) {
      queryClient.invalidateQueries({ queryKey: SUMMONER_QUERY_KEY });
    }

    // If state changes from LOGGED_IN to something else, clear the summoner data

    previousStateRef.current = currentState;
    // @ts-ignore
  }, [state?.clientState, queryClient]);

  // Function to update state from websocket
  const update = (websocketData: CurrentSummoner) => {
    queryClient.setQueryData(SUMMONER_QUERY_KEY, websocketData);
  };

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
