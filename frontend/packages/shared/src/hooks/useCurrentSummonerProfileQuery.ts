import type {CurrentSummoner} from '@types';
import * as Summoner from '@summonerClient';

import {useQuery, useQueryClient} from '@tanstack/react-query';
import {Events} from '@wailsio/runtime';
import {useEffect} from 'react';

export const CURRENT_SUMMONER_PROFILE_KEY = ['currentSummoner', 'profile'];

export function useCurrentSummonerProfileQuery() {
  const queryClient = useQueryClient();

  // For initial fetch and refetching
  const { data: currentSummonerProfile, isLoading, error, refetch } = useQuery({
    queryKey: CURRENT_SUMMONER_PROFILE_KEY,
    queryFn: Summoner.Client.GetCurrentSummonerProfile,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Function to update state from websocket
  const update = (websocketData: CurrentSummoner) => {
    queryClient.setQueryData(CURRENT_SUMMONER_PROFILE_KEY, websocketData);
  };

  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-summoner_v1_current-summoner', (event) => {
      console.log('lol-summoner_v1_current-summoner', event.data[0]);
      if ('backgroundSkinId' in event.data[0]) {
        update(event.data[0]);
      }
    });

    return () => {
      cancel();
    };
  }, [update]);
  // Connect this to your websocket listener elsewhere

  return {
    currentSummonerProfile,
    isLoading,
    error,
    refetch,
    refresh: async () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_SUMMONER_PROFILE_KEY });
    },
    clearSummoner: () => {
      queryClient.setQueryData(CURRENT_SUMMONER_PROFILE_KEY, null);
    },
    update, // Export to use with websocket
  };
}
