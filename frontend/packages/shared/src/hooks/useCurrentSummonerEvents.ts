import { useCurrentSummonerQuery } from '@/hooks/useCurrentSummonerQuery.ts';
import { Events } from '@wailsio/runtime';
import { useEffect } from 'react';

export function UseCurrentSummonerEvents() {
  const { update } = useCurrentSummonerQuery();

  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-summoner_v1_current-summoner', (event) => {
      console.log('lol-summoner_v1_current-summoner', event.data[0]);
      if (typeof event.data[0] === 'object' && 'accountId' in event.data[0]) {
        update(event.data[0]);
      }
    });

    return () => {
      cancel();
    };
  }, [update]);
}
