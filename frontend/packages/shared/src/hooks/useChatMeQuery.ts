import type {CurrentSummoner} from '@types';
import * as Summoner from '@summonerClient';
import {useQuery, useQueryClient} from '@tanstack/react-query';

export const CHAT_ME_QUERY = ['currentSummoner'];

export function useChatMeQuery() {
  const queryClient = useQueryClient();

  // For initial fetch and refetching
  const { data: chatMe, isLoading, error, refetch } = useQuery({
    queryKey: CHAT_ME_QUERY,
    queryFn: Summoner.Client.GetLolChat,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Function to update state from websocket
  const update = (websocketData: CurrentSummoner) => {
    queryClient.setQueryData(CHAT_ME_QUERY, websocketData);
  };

  // Connect this to your websocket listener elsewhere

  return {
    chatMe,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: CHAT_ME_QUERY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(CHAT_ME_QUERY, null);
    },
    update, // Export to use with websocket
  };
}
