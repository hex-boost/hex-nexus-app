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
  const { isLaunchRiotClientPending, isLoginPending, handleLaunchRiotClient, handleOpenCaptchaWebview, isCaptchaSolvingPending } = useLeagueManager({ account });

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
            disabled={isCaptchaSolvingPending}
            loading={isCaptchaSolvingPending}
            className="flex-1 bg-blue-600 w-full hover:bg-blue-700 text-white"
            onClick={() => handleOpenCaptchaWebview()}
          >
            {!isLoginPending
              ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login to
                    account
                  </>
                )
              : (
                  'Authenticating...'
                )}
          </Button>
        );

      case CLIENT_STATES.LOGGED_IN:
        return (
          <Button
            disabled
            className="flex-1 w-full bg-green-600 text-white cursor-default"
          >
            Conectado ao LoL
          </Button>
        );

      default:
        return (
          <Button
            loading
            variant="ghost"
            disabled
            className="flex-1 w-full bg-gray-600 text-white cursor-default"
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
