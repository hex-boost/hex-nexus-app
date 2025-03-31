import { ClientMonitor } from '@league';
import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

export const CLIENT_STATES = {
  CHECKING: 'league:client:checking',
  CLOSED: 'league:client:closed',
  OPEN: 'league:client:open',
  LOGIN_READY: 'league:client:loginready',
  LOGGED_IN: 'league:client:loggedin',
  CAPTCHA_SOLVING: 'league:client:captchasolving', // Novo estado

};

export function useLeagueEvents() {
  ClientMonitor.Start();
  const [clientState, setClientState] = useState(CLIENT_STATES.CHECKING);

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
      ClientMonitor.Stop();
      removeClosedListener();
      removeOpenListener();
      removeLoginReadyListener();
      removeLoggedInListener();

      Events.Off(
        CLIENT_STATES.CLOSED,
        CLIENT_STATES.OPEN,
        CLIENT_STATES.LOGIN_READY,
        CLIENT_STATES.LOGGED_IN,
      );
    };
  }, []);

  return {
    clientState,
    setClientState,
  };
}
