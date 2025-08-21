import type { CurrentSummoner } from '@types';
import { useLeagueState } from '@/hooks/useLeagueState.tsx';
import { LeagueClientStateType } from '@league';

import * as Summoner from '@summonerClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const CHAT_ME_QUERY = ['CHAT', 'ME'];

export function useChatMeQuery() {
  console.log('[useChatMeQuery] Hook initialized');
  const queryClient = useQueryClient();
  const { state } = useLeagueState();

  // For initial fetch and refetching
  const { data: chatMe, isLoading, error, refetch } = useQuery({
    queryKey: CHAT_ME_QUERY,
    queryFn: async () => {
      console.log('[useChatMeQuery] Executing GetLolChat query');
      try {
        const result = await Summoner.Client.GetLolChat();
        console.log('[useChatMeQuery] Query successful:', result);
        return result;
      } catch (error) {
        console.error('[useChatMeQuery] Query failed:', error);
        throw error;
      }
    },
    enabled: state?.clientState === LeagueClientStateType.ClientStateLoggedIn,
  });

  console.log('[useChatMeQuery] Current state:', {
    chatMe,
    isLoading,
    hasError: !!error,
    platformId: chatMe?.platformId,
  });

  // Function to update state from websocket
  const update = (websocketData: CurrentSummoner) => {
    console.log('[useChatMeQuery] Updating from websocket with data:', websocketData);
    queryClient.setQueryData(CHAT_ME_QUERY, websocketData);
  };

  // Wrap refetch to add logging
  const wrappedRefetch = async () => {
    console.log('[useChatMeQuery] Manual refetch triggered');
    const result = await refetch();
    console.log('[useChatMeQuery] Manual refetch completed with result:', result.);
    return result;
  };

  return {
    chatMe,
    isLoading,
    error,
    refetch: wrappedRefetch,
    refresh: async () => {
      console.log('[useChatMeQuery] Invalidating query cache');
      await queryClient.invalidateQueries({ queryKey: CHAT_ME_QUERY });
      console.log('[useChatMeQuery] Query cache invalidated');
    },
    clearSummoner: () => {
      console.log('[useChatMeQuery] Clearing summoner data');
      queryClient.setQueryData(CHAT_ME_QUERY, null);
    },
    update, // Export to use with websocket
  };
}
