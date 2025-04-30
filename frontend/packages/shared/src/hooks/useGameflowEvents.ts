import {useGameflowPhase} from '@/hooks/useGameflowPhaseQuery.ts';
import {Events} from '@wailsio/runtime';
import {useEffect} from 'react';

export function useGameflowEvents() {
  const { update: updateGameflowPhase } = useGameflowPhase();

  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-gameflow_v1_session', (event) => {
      console.log('lol-gameflow_v1_gameflow-phase', event.data[0]);
      updateGameflowPhase(event.data[0]);
    });

    return () => {
      cancel();
    };
  }, [updateGameflowPhase]);
}
