
import type { AccountType } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { useLeagueEvents } from '@/hooks/useLeagueEvents.tsx';
import { useLeagueManager } from '@/hooks/useLeagueManager.tsx';
import { LeagueClientState } from '@/types/LeagueClientState.ts';
import { LogIn } from 'lucide-react';

type RentedAccountButtonProps = {
  account: AccountType;
};

export function RentedAccountButton({ account }: RentedAccountButtonProps) {
  const { clientInfo } = useLeagueEvents();
  const { isLaunchRiotClientPending, handleLaunchRiotClient, handleOpenCaptchaWebview } = useLeagueManager({ account });

  const renderButton = () => {
    const { clientState, authState } = clientInfo;

    switch (clientState) {
      case LeagueClientState.CLOSED:
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

      case LeagueClientState.LOGIN_READY:
        return (
          <Button
            disabled={authState !== ''}
            loading={authState !== ''}
            className="flex-1 bg-blue-600 w-full hover:bg-blue-700 text-white"
            onClick={() => handleOpenCaptchaWebview()}
          >
            {authState === 'WAITING_CAPTCHA'
              ? (
                  <>Waiting captcha to be solved</>
                )
              : authState === 'WAITING_LOGIN'
                ? (
                    <>Authenticating...</>
                  )
                : authState === 'LOGIN_SUCCESS'
                  ? (
                      <>Login successfully</>
                    )
                  : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Login to account
                      </>
                    )}
          </Button>
        );

      case LeagueClientState.LOGGED_IN:
        return (
          <Button
            disabled
            variant="ghost"
            className="flex-1 w-full border text-white cursor-default"
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
            className="flex-1 w-full cursor-none border"
          >
            Waiting client...
          </Button>
        );
    }
  };

  return <>{renderButton()}</>;
}
