import { Button } from '@/components/ui/button.tsx';
import { useLeagueClient } from '@/hooks/useLeagueClient';
import { LogIn } from 'lucide-react';

const CLIENT_STATES = {
  CLOSED: 'league:client:closed',
  OPEN: 'league:client:open',
  LOGIN_READY: 'league:client:loginready',
  LOGGED_IN: 'league:client:loggedin',
  RENTED_ACCOUNT: 'league:account:rented',
};

export function RentedAccountButton() {
  const {
    clientState,
    accountInfo,
    isLoginPending,
    handleOpenLeagueClient,
    handleLoginToAccount,
  } = useLeagueClient();

  const renderButton = () => {
    switch (clientState) {
      case CLIENT_STATES.CLOSED:
        return (
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleOpenLeagueClient}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Open League of Legends
          </Button>
        );

      case CLIENT_STATES.LOGIN_READY:
        return (
          <Button
            disabled={isLoginPending}
            loading={isLoginPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleLoginToAccount}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login to LoL
          </Button>
        );

      case CLIENT_STATES.LOGGED_IN:
        return (
          <Button
            disabled
            className="flex-1 bg-green-600 text-white cursor-default"
          >
            Connected to LoL
          </Button>
        );

      default:
        return (
          <Button
            disabled
            className="flex-1 bg-yellow-600 text-white cursor-default"
          >
            Waiting for client...
          </Button>
        );
    }
  };

  return (
    <div className="account-status-container">
      <div className="mt-4">
        {renderButton()}

        {accountInfo && (
          <div className="mt-2 text-sm text-gray-500">
            {clientState === CLIENT_STATES.LOGGED_IN && (
              <span>
                Connected as
                {accountInfo.username}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
