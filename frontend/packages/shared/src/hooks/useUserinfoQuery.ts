import type {UserInfo} from '@types';
import * as Summoner from '@summonerClient';
import {useQuery, useQueryClient} from '@tanstack/react-query';

export const USER_INFO_QUERY = ['userinfo'];

export function useUserinfoQuery() {
  const queryClient = useQueryClient();

  // For initial fetch and refetching
  const { data: userinfo, isLoading, error, refetch } = useQuery({
    queryKey: USER_INFO_QUERY,
    queryFn: Summoner.Client.GetUserInfo,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Function to update state from websocket
  const update = (websocketData: UserInfo) => {
    queryClient.setQueryData(USER_INFO_QUERY, websocketData);
  };

  // Connect this to your websocket listener elsewhere

  return {
    userinfo,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: USER_INFO_QUERY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(USER_INFO_QUERY, null);
    },
    update, // Export to use with websocket
  };
}
