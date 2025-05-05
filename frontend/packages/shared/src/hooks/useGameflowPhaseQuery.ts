import * as Summoner from '@summonerClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Events } from '@wailsio/runtime';
import { useCallback, useEffect } from 'react';

export const GAMEFLOW_PHASE_QUERY = ['gameflow-phase'];
export enum LolChallengesGameflowPhase {
  TerminatedInError = 'TerminatedInError',
  EndOfGame = 'EndOfGame',
  PreEndOfGame = 'PreEndOfGame',
  WaitingForStats = 'WaitingForStats',
  Reconnect = 'Reconnect',
  InProgress = 'InProgress',
  FailedToLaunch = 'FailedToLaunch',
  GameStart = 'GameStart',
  ChampSelect = 'ChampSelect',
  ReadyCheck = 'ReadyCheck',
  CheckedIntoTournament = 'CheckedIntoTournament',
  Matchmaking = 'Matchmaking',
  Lobby = 'Lobby',
  None = 'None',
}
export function useGameflowPhase() {
  const queryClient = useQueryClient();
  // For initial fetch and refetching
  const { data: gameflowPhase, isLoading, error, refetch } = useQuery({
    queryKey: GAMEFLOW_PHASE_QUERY,
    queryFn: Summoner.Client.GetGameflowSession,
    retry: 1,

  });

  // Function to update state from websocket
  const update = useCallback((data: LolChallengesGameflowPhase) => {
    queryClient.setQueryData(GAMEFLOW_PHASE_QUERY, data);
  }, [queryClient]);

  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-gameflow_v1_session', (event) => {
      console.log('gameflow_v1_session', event.data[0]);
      if (!event.data[0]) {
        return;
      }
      update(event.data[0]);
    });

    return () => {
      cancel();
    };
  }, [update]);

  return {
    gameflowPhase,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: GAMEFLOW_PHASE_QUERY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(GAMEFLOW_PHASE_QUERY, null);
    },
    update, // Export to use with websocket
  };
}
