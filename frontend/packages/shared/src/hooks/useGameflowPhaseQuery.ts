import * as Summoner from '@summonerClient';
import {useQuery, useQueryClient} from '@tanstack/react-query';

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
    staleTime: 5 * 60 * 1000,
    retry: 3,
    refetchInterval: 60 * 1000, // Re-fetch every 3 seconds

  });

  // Function to update state from websocket
  const update = (data: LolChallengesGameflowPhase) => {
    queryClient.setQueryData(GAMEFLOW_PHASE_QUERY, data);
  };

  // Connect this to your websocket listener elsewhere

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
