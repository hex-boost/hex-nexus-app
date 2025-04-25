import type { LeagueClientState } from '@league';
import { logger } from '@/lib/logger';
import { Monitor as ClientMonitor } from '@league';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

export function useLeagueState() {
  const [state, setState] = useState<LeagueClientState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logContext = 'useLeagueState';

  useEffect(() => {
    let mounted = true;
    logger.info(logContext, 'Initializing league state hook');

    // Get initial state
    ClientMonitor.GetCurrentState()
      .then((initialState: LeagueClientState) => {
        if (mounted) {
          logger.info(logContext, 'Received initial state', initialState);
          setState(initialState);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          logger.error(logContext, 'Failed to get initial state', error);
          setIsLoading(false);
        }
      });

    // Listen for state changes
    const cleanup = Events.On('league:state:changed', (event: { data: LeagueClientState[] }) => {
      if (mounted) {
        logger.info(logContext, 'State changed event received', event);
        setState(event.data[0]);
      }
    });

    return () => {
      mounted = false;
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
