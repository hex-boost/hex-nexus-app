import type { LeagueClientState } from '@league';
import { logger } from '@/lib/logger';
import { ClientMonitor } from '@league';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Events } from '@wailsio/runtime';
import { useEffect } from 'react';

// Chave para identificar esta consulta no cache
const LEAGUE_STATE_QUERY_KEY = ['leagueState'];

// Função de busca para o useQuery
const fetchLeagueState = async (): Promise<LeagueClientState> => {
  try {
    logger.info('fetchLeagueState', 'Fetching league state');
    return await ClientMonitor.GetCurrentState() as LeagueClientState;
  } catch (e) {
    logger.error('fetchLeagueState', 'Error fetching league state', e);
    throw e;
  }
};

export function useLeagueState() {
  const queryClient = useQueryClient();
  const logContext = 'useLeagueState';

  // Configurar o listener para eventos de mudança de estado
  useEffect(() => {
    logger.info(logContext, 'Configurando listener para mudanças de estado');

    const cleanup = Events.On('league:state:changed', (event: { data: LeagueClientState[] }) => {
      logger.info(logContext, 'Evento de mudança de estado recebido', event);

      // Atualizar os dados diretamente no cache
      queryClient.setQueryData(LEAGUE_STATE_QUERY_KEY, event.data[0]);
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
      logger.info(logContext, 'Listener de mudanças de estado removido');
    };
  }, [queryClient]);

  // Usar useQuery para gerenciar o estado
  const query = useQuery({
    queryKey: LEAGUE_STATE_QUERY_KEY,
    queryFn: fetchLeagueState,
    staleTime: Infinity, // Os dados só ficarão obsoletos quando invalidados explicitamente
    retry: 2,
  });

  return {
    state: query.data ?? null,
    isLoading: query.isLoading,
    setState: (newState: LeagueClientState) =>
      queryClient.setQueryData(LEAGUE_STATE_QUERY_KEY, newState),
    error: query.error,
    status: query.status,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}
