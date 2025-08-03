import type { AccountType } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';

import { useLeagueManager } from '@/hooks/useLeagueManager.tsx';
import { LeagueClientStateType } from '@league';
import { LogIn } from 'lucide-react';

type RentedAccountButtonProps = {
  account: AccountType;
};

export function RentedAccountButton({ account }: RentedAccountButtonProps) {
  const {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleOpenCaptchaWebview,
    clientState,
    isStateLoading,
  } = useLeagueManager({ account });

  if (isStateLoading || (clientState === LeagueClientStateType.ClientStateNone)) {
    return (
      <Button
        loading
        variant="ghost"
        className="flex-1 w-full text-white"
      >
        Loading...
      </Button>
    );
  }
  if (clientState === LeagueClientStateType.ClientStateWaitingCaptcha || clientState === LeagueClientStateType.ClientStateWaitingLogin) {
    return (
      <Button
        disabled
        loading
        variant="ghost"
        className="flex-1 w-full text-white"
      >
        {clientState === LeagueClientStateType.ClientStateWaitingCaptcha
          ? 'Waiting captcha solve'
          : 'Authenticating...'}
      </Button>
    );
  }

  // Then handle client state
  const renderButton = () => {
    if (isLaunchRiotClientPending) {
      return (
        <Button
          loading={isLaunchRiotClientPending}
          disabled={isLaunchRiotClientPending}
          className="flex-1 !w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Opening League...
        </Button>
      );
    }

    switch (clientState) {
      case LeagueClientStateType.ClientStateClosed:
        return (
          <Button
            className="flex-1 !w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleLaunchRiotClient()}
          >
            {!isLaunchRiotClientPending && !isStateLoading
              ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Open League
                  </>
                )
              : (
                  'Opening league...'
                )}
          </Button>
        );

      case LeagueClientStateType.ClientStateLoginReady:
        // Always enable login button in LOGIN_READY state, regardless of auth state
        return (
          <Button
            variant="default"
            className="flex-1  bg-blue-600 !w-full hover:bg-blue-700 text-white"
            onClick={() => handleOpenCaptchaWebview()}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login to account
          </Button>
        );

      case LeagueClientStateType.ClientStateLoggedIn:
        return (
          <Button
            disabled
            variant="ghost"
            className="flex-1 !w-full border text-white cursor-default"
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
            className="flex-1 !w-full cursor-none border"
          >
            Waiting...
          </Button>
        );
    }
  }
    ;

  return (
    <>
      {renderButton()}
    </>
  );
}
