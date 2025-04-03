import type { LeagueClientState } from '@league';
import { logger } from '@/lib/logger';
import { ClientMonitor } from '@league';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

export function useLeagueState() {
  const [state, setState] = useState<LeagueClientState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logContext = 'useLeagueState';

  useEffect(() => {
    logger.info(logContext, 'Initializing league state hook');

    // Get initial state
    setIsLoading(true);
    ClientMonitor.GetCurrentState()
      .then((initialState: LeagueClientState) => {
        logger.info(logContext, 'Received initial state', initialState);
        setState(initialState);
        setIsLoading(false);
      })
      .catch((error) => {
        logger.error(logContext, 'Failed to get initial state', error);
        setIsLoading(false);
      });

    // Listen for state changes
    const cleanup = Events.On('league:state:changed', (event: { data: LeagueClientState[] }) => {
      logger.info(logContext, 'State changed event received', event);
      setState(event.data[0]);
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return {
    state,
    setState,
    isLoading,
  };
}
