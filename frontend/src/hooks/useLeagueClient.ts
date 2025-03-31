import type { AccountType } from '@/types/types';
import { Client } from '@riot';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';
import { useAccountAuthentication } from './useAccountAuthentication';

const CLIENT_STATES = {
  CLOSED: 'league:client:closed',
  OPEN: 'league:client:open',
  LOGIN_READY: 'league:client:loginready',
  LOGGED_IN: 'league:client:loggedin',
  RENTED_ACCOUNT: 'league:account:rented',
};

export function useLeagueClient(account: AccountType) {
  const [clientState, setClientState] = useState(CLIENT_STATES.CLOSED);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const { handleLoginToAccount, isLoginPending } = useAccountAuthentication({ account });

  useEffect(() => {
    const removeClosedListener = Events.On(CLIENT_STATES.CLOSED, () => {
      setClientState(CLIENT_STATES.CLOSED);
    });

    const removeOpenListener = Events.On(CLIENT_STATES.OPEN, () => {
      setClientState(CLIENT_STATES.OPEN);
    });

    const removeLoginReadyListener = Events.On(CLIENT_STATES.LOGIN_READY, () => {
      setClientState(CLIENT_STATES.LOGIN_READY);
    });

    const removeLoggedInListener = Events.On(CLIENT_STATES.LOGGED_IN, () => {
      setClientState(CLIENT_STATES.LOGGED_IN);
    });

    return () => {
      removeClosedListener();
      removeOpenListener();
      removeLoginReadyListener();
      removeLoggedInListener();

      Events.Off(
        CLIENT_STATES.CLOSED,
        CLIENT_STATES.OPEN,
        CLIENT_STATES.LOGIN_READY,
        CLIENT_STATES.LOGGED_IN,
        CLIENT_STATES.RENTED_ACCOUNT,
      );
    };
  }, []);

  const handleOpenLeagueClient = async () => {
    try {
      await Client.LaunchRiotClient();
    } catch (error) {
      console.error('Failed to open client:', error);
    }
  };

  return {
    clientState,
    accountInfo,
    isLoginPending,
    setAccountInfo,
    handleOpenLeagueClient,
    handleLoginToAccount,
  };
}
