import type { AccountType } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { useLeagueEvents } from '@/hooks/useLeagueEvents.ts';
import { useLeagueManager } from '@/hooks/useLeagueManager.ts';
import { LogIn } from 'lucide-react';

const CLIENT_STATES = {
  CHECKING: 'league:client:checking',
  CLOSED: 'league:client:closed',
  OPEN: 'league:client:open',
  LOGIN_READY: 'league:client:loginready',
  LOGGED_IN: 'league:client:loggedin',
  RENTED_ACCOUNT: 'league:account:rented',
};

type RentedAccountButtonProps = {
  account: AccountType;
};

export function RentedAccountButton({ account }: RentedAccountButtonProps) {
  const { clientState } = useLeagueEvents();
  const { isLaunchRiotClientPending, handleLaunchRiotClient, handleOpenCaptchaWebview, authenticationState } = useLeagueManager({ account });

  const renderButton = () => {
    switch (clientState) {
      case CLIENT_STATES.CLOSED:
        return (
          <Button
            loading={isLaunchRiotClientPending}
            disabled={isLaunchRiotClientPending}
            className="flex-1 w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleLaunchRiotClient()}
          >
            {!isLaunchRiotClientPending
              ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Open League
                  </>
                )
              : (

                  'Starting Riot Client...'
                )}
          </Button>
        );

      case CLIENT_STATES.LOGIN_READY:
        return (
          <Button
            disabled={authenticationState !== ''}
            loading={authenticationState !== ''}
            className="flex-1 bg-blue-600 w-full hover:bg-blue-700 text-white"
            onClick={() => handleOpenCaptchaWebview()}
          >
            {authenticationState === 'WAITING_CAPTCHA'
              ? (
                  <>
                    Waiting captcha to be solved
                  </>
                )
              : authenticationState === 'WAITING_LOGIN'
                ? (
                    <>
                      Authenticating...
                    </>
                  )
                : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login to
                      account
                    </>
                  )}
          </Button>

        );

      case CLIENT_STATES.LOGGED_IN:
        return (
          <Button
            disabled
            variant="ghost"
            className="flex-1 w-full border  text-white cursor-default"
          >
            Logged in
          </Button>
        );

      default:
        return (
          <Button
            loading
            variant="ghost"
            disabled
            className="flex-1 w-full   cursor-none border "
          >
            Waiting client...
          </Button>
        );
    }
  };

  return (
    <>
      {renderButton()}

    </>
  );
}
