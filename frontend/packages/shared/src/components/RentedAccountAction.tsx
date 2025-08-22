import type { AccountType } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { useLeagueManager } from '@/hooks/useLeagueManager.tsx';

import { Manager } from '@leagueManager';
import { LogIn, Play, X } from 'lucide-react';
import { useState } from 'react';

type RentedAccountButtonProps = {
  account: AccountType;
};

export function RentedAccountButton({ account }: RentedAccountButtonProps) {
  const {
    isLaunchRiotClientPending,
    handleLaunchRiotClient,
    handleOpenCaptchaWebview,
    isCaptchaProcessing,
    // clientState,
    // isStateLoading,
  } = useLeagueManager({ account });
  const [showConfirm, setShowConfirm] = useState(false);
  // if (isStateLoading || (clientState === LeagueClientStateType.ClientStateNone)) {
  //   return (
  //     <Button
  //       loading
  //       variant="ghost"
  //       className="flex-1 w-full text-white"
  //     >
  //       Loading...
  //     </Button>
  //   );
  // }
  // if (clientState === LeagueClientStateType.ClientStateWaitingCaptcha || clientState === LeagueClientStateType.ClientStateWaitingLogin) {
  //   return (
  //     <Button
  //       disabled
  //       loading
  //       variant="ghost"
  //       className="flex-1 w-full text-white"
  //     >
  //       {clientState === LeagueClientStateType.ClientStateWaitingCaptcha
  //         ? 'Waiting captcha solve'
  //         : 'Authenticating...'}
  //     </Button>
  //   );
  // }

  // Then handle client state
  const renderButton = () => {
    return (
      <>
        <Button
          loading={isCaptchaProcessing}
          disabled={isCaptchaProcessing}
          className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleOpenCaptchaWebview()}
        >
          {!isCaptchaProcessing
            ? (
                <>

                  <LogIn className="mr-2 h-4 w-4" />
                  Login to account
                </>
              )
            : (
                'Logging in...'
              )}
        </Button>
        <div className="flex col-span-3 w-full gap-2 ">

          <Button
            disabled={isLaunchRiotClientPending}
            loading={isLaunchRiotClientPending}
            variant="secondary"
            className="   !w-full  "
            onClick={() => handleLaunchRiotClient()}
          >

            <Play className="mr-2 h-4 w-4" />
            Open League
          </Button>

          <Button
            variant="destructive"
            className="!w-full"
            onClick={() => setShowConfirm(true)}
          >
            <>
              <X className="mr-2 h-4 w-4" />
              Close League
            </>
          </Button>
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Close</DialogTitle>
                <DialogDescription>
                  Are you sure you want to close League of Legends?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    Manager.ForceCloseAllClients();
                    setShowConfirm(false);
                  }}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </>
    );

    // switch (clientState) {
    //   case LeagueClientStateType.ClientStateClosed:
    //     return (
    //       <Button
    //         className="flex-1 !w-full bg-blue-600 hover:bg-blue-700 text-white"
    //         onClick={() => handleLaunchRiotClient()}
    //       >
    //         {!isLaunchRiotClientPending && !isStateLoading
    //           ? (
    //               <>
    //                 <LogIn className="mr-2 h-4 w-4" />
    //                 Open League
    //               </>
    //             )
    //           : (
    //               'Opening league...'
    //             )}
    //       </Button>
    //     );
    //
    //   case LeagueClientStateType.ClientStateLoginReady:
    //     // Always enable login button in LOGIN_READY state, regardless of auth state
    //     return (
    //       <Button
    //         variant="default"
    //         className="flex-1  bg-blue-600 !w-full hover:bg-blue-700 text-white"
    //         onClick={() => handleOpenCaptchaWebview()}
    //       >
    //         <LogIn className="mr-2 h-4 w-4" />
    //         Login to account
    //       </Button>
    //     );
    //
    //   case LeagueClientStateType.ClientStateLoggedIn:
    //     return (
    //       <Button
    //         disabled
    //         variant="ghost"
    //         className="flex-1 !w-full border text-white cursor-default"
    //       >
    //         Logged in
    //       </Button>
    //     );
    //   default:
    //     return (
    //       <Button
    //         loading
    //         variant="ghost"
    //         disabled
    //         className="flex-1 !w-full cursor-none border"
    //       >
    //         Waiting...
    //       </Button>
    //     );
    // }
  }
    ;

  return (
    <>
      {renderButton()}
    </>
  );
}
