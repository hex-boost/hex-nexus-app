import type { LeagueAuthenticationState, LeagueClientInfo } from '@/types/LeagueClientState';
import { LeagueClientState } from '@/types/LeagueClientState';

import { ClientMonitor } from '@league';
import { Events } from '@wailsio/runtime';
import { createContext, useContext, useEffect, useState } from 'react';


const LeagueClientContext = createContext<{
  clientInfo: LeagueClientInfo;
  updateClientState: (state: LeagueClientState) => void;
  updateAuthState: (state: LeagueAuthenticationState, error?: string) => void;
}>({
      clientInfo: {
        clientState: LeagueClientState.CHECKING,
        authState: '',
      },
      updateClientState: () => {},
      updateAuthState: () => {},
    });

// Provider para o contexto
export function LeagueClientProvider({ children }) {
  const [clientInfo, setClientInfo] = useState<LeagueClientInfo>({
    clientState: LeagueClientState.CHECKING,
    authState: '',
  });

  const updateClientState = (newState: LeagueClientState) => {
    setClientInfo(prev => ({ ...prev, clientState: newState }));
  };

  const updateAuthState = (authState: LeagueAuthenticationState, errorMessage?: string) => {
    setClientInfo(prev => ({ ...prev, authState, errorMessage }));
  };

  useEffect(() => {
    // Inicia o monitor do cliente
    ClientMonitor.Start();

    // Configuração dos listeners de eventos
    const eventHandlers = Object.values(LeagueClientState)
      .filter(state => state !== LeagueClientState.CHECKING)
      .map((state) => {
        return {
          event: state,
          handler: () => updateClientState(state as LeagueClientState),
          cleanup: null as (() => void) | null,
        };
      });

    // Registra os listeners
    eventHandlers.forEach((item) => {
      item.cleanup = Events.On(item.event, item.handler);
    });

    // Cleanup function
    return () => {
      ClientMonitor.Stop();
      // Remove todos os listeners
      eventHandlers.forEach((item) => {
        if (item.cleanup) {
          item.cleanup();
        }
      });
    };
  }, []);

  return (
    <LeagueClientContext value={{ clientInfo, updateClientState, updateAuthState }}>
      {children}
    </LeagueClientContext>
  );
}

// Hook personalizado para acessar o contexto
export function useLeagueEvents() {
  const context = useContext(LeagueClientContext);

  if (!context) {
    throw new Error('useLeagueEvents deve ser usado dentro de um LeagueClientProvider');
  }

  return context;
}
