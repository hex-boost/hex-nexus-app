import * as Summoner from '@summonerClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useGetLolLobbySession() {
  const LOL_LOBBY_SESSION_QUERY = ['lol-lobby', 'session'];
  const queryClient = useQueryClient();
  const { data: currentLobby, isLoading, error, refetch } = useQuery({
    queryKey: LOL_LOBBY_SESSION_QUERY,
    queryFn: Summoner.Client.GetLolLobbySession,
  });

  return {
    currentLobby,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: LOL_LOBBY_SESSION_QUERY });
    },
    clearLobby: () => {
      queryClient.setQueryData(LOL_LOBBY_SESSION_QUERY, null);
    },
  };
}
