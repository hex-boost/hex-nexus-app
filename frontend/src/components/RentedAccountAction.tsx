import type { AccountType } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { useLeagueManager } from '@/hooks/useLeagueManager.tsx';
import { useUserStore } from '@/stores/useUserStore.ts';
import { LeagueAuthState } from '@/types/LeagueAuthState.ts';
import { LeagueClientState } from '@/types/LeagueClientState.ts';
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
    authenticationState: authState,
  } = useLeagueManager({ account });
  const { user } = useUserStore();
  // First check if we're in an auth flow regardless of client state
  if (authState === LeagueAuthState.WAITING_CAPTCHA || authState === LeagueAuthState.WAITING_LOGIN) {
    return (
      <Button
        disabled
        loading
        variant="ghost"
        className="flex-1 w-full text-white"
      >
        {authState === LeagueAuthState.WAITING_CAPTCHA
          ? 'Waiting captcha solve'
          : 'Authenticating...'}
      </Button>
    );
  }

  // Then handle client state
  const renderButton = () => {
    switch (clientState) {
      case LeagueClientState.CLOSED:
        return (
          <Button
            loading={isLaunchRiotClientPending}
            disabled={isLaunchRiotClientPending}
            className="flex-1 !w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                  'Opening league...'
                )}
          </Button>
        );

      case LeagueClientState.LOGIN_READY:
        // Always enable login button in LOGIN_READY state, regardless of auth state
        return (
          <Button
            variant="default"
            disabled={account.user?.documentId !== user?.documentId}
            className="flex-1  bg-blue-600 !w-full hover:bg-blue-700 text-white"
            onClick={() => handleOpenCaptchaWebview()}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login to account
          </Button>
        );

      case LeagueClientState.LOGGED_IN:
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
  };

  return (
    <>
      {renderButton()}
    </>
  );
}
