import { useSummonerQuery } from '@/hooks/useSummonerQuery.ts';
import { Events } from '@wailsio/runtime';
import { useEffect } from 'react';

export function useSummonerEvents() {
  const { update } = useSummonerQuery();

  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-summoner_v1_current-summoner', (event) => {
      console.log('lol-summoner_v1_current-summoner', event.data[0]);
      update(event.data[0]);
    });

    return () => {
      cancel();
    };
  }, [update]);
}
