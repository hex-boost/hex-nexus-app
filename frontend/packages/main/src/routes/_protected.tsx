import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout.tsx';

// frontend/src/routes/_protected.tsx
import { CloseConfirmationHandler } from '@/components/CloseConfirmation.tsx';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { DefaultContextMenu } from '@/components/DefaultContextMenu.tsx';
import { PremiumContentDialog } from '@/components/paywall/premium-content-dialog.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { WindowControls } from '@/components/WindowControls.tsx';
import { ContextMenuProvider } from '@/contexts/ContextMenuContext.tsx';
import { useLobbyRevealer } from '@/features/lobby-revealer/hooks/useLobbyRevealer.ts';
import { LobbyRevealerDock } from '@/features/lobby-revealer/lobby-revealer-dock.tsx';
import { NotificationProvider } from '@/features/notification/notification-provider.tsx';
import { NotificationBell } from '@/features/notification/NotificationBell.tsx';
import { UserProfile } from '@/features/user-profile/UserProfile.tsx';
import { useChatMeQuery } from '@/hooks/useChatMeQuery.ts';
import { useCommonFetch } from '@/hooks/useCommonFetch.ts';
import { useFavoriteAccounts } from '@/hooks/useFavoriteAccounts.ts';
import { LolChallengesGameflowPhase, useGameflowPhase } from '@/hooks/useGameflowPhaseQuery.ts';
import { useMembership } from '@/hooks/useMembership.ts';
import { useUserStore } from '@/stores/useUserStore';
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';
import { Browser } from '@wailsio/runtime';
import React, { useEffect, useState } from 'react';
import { cls } from 'react-image-crop';
import 'non.geist';

export const Route = createFileRoute('/_protected')({
  component: DashboardLayout,
});

function DashboardLayout() {
  const router = useRouter();
  const { logout, user } = useUserStore();
  const { isUserLoading, refetchUser } = useCommonFetch();
  const { gameflowPhase } = useGameflowPhase();
  const { refetch, chatMe } = useChatMeQuery();
  const [openPremiumDialog, setOpenPremiumDialog] = useState(false);
  const { getMultiSearchUrl, summonerCards, isPending } = useLobbyRevealer({ platformId: chatMe?.platformId || '' });
  const { pricingPlans } = useMembership();
  useEffect(() => {
    console.log('[DashboardLayout] gameflowPhase changed:', gameflowPhase?.phase);
    if (gameflowPhase?.phase === LolChallengesGameflowPhase.ChampSelect) {
      console.log('[DashboardLayout] ChampSelect detected, triggering chatMe refetch');
      refetch();
    }
  }, [gameflowPhase, refetch]);

  useEffect(() => {
    console.log('[DashboardLayout] AppleStyleDock render conditions:', {
      isChampSelect: gameflowPhase?.phase === LolChallengesGameflowPhase.ChampSelect,
      isPending,
      hasSummonerCards: summonerCards,
      chatMePlatformId: chatMe?.platformId,
    });
  }, [gameflowPhase, isPending, summonerCards, chatMe]);

  function handleLogout() {
    logout();
    router.navigate({ to: '/login' });
  }

  const isLoading = isUserLoading;
  const userAvatar = import.meta.env.VITE_API_URL + user?.avatar?.url;

  const { updateFavoriteNote, isNoteDialogOpen, setIsNoteDialogOpen, noteText, setNoteText, handleSaveNote } = useFavoriteAccounts();

  async function handleOpenOpgg(summonerCards: string[]) {
    if (!user?.premium?.plan?.hasLobbyRevealer) {
      setOpenPremiumDialog(true);
      return;
    }
    await Browser.OpenURL(getMultiSearchUrl(summonerCards));
  }
  return (
    <>
      {
        gameflowPhase?.phase === LolChallengesGameflowPhase.ChampSelect && !isPending && summonerCards
        && (
          <>
            {console.log('[DashboardLayout] Rendering AppleStyleDock with:', {
              summonerCards,
              multiSearchUrl: getMultiSearchUrl(summonerCards),
            })}
            <LobbyRevealerDock onClickAction={() => handleOpenOpgg(summonerCards)} />
          </>
        )
      }
      <PremiumContentDialog
        title="Unlock Lobby Revealer"
        description="Get instant insights on players in your lobby and gain a strategic advantage before the match even starts."
        ctaText="Upgrade Now"
        features={pricingPlans.find(plan => plan.tier_enum === 'pro')?.benefits.map(item => item.title) || []}
        onAction={() => router.navigate({ to: '/subscription' })}
        open={openPremiumDialog}
        onOpenChange={() => setOpenPremiumDialog(false)}
      />
      <CloseConfirmationHandler />

      <NotificationProvider>
        <ContextMenuProvider>
          <DefaultContextMenu>
            <div className="flex flex-col min-h-screen bg-background">

              <div
                className={cls('sticky top-0 z-50  backdrop-blur-md bg-black/20 border-b ml-[84px]')}
                style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
              >
                <div className="grid grid-flow-col justify-end items-center gap-4 py-2">
                  <div className="hidden sm:flex justify-center items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full">
                    <CoinIcon className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    {isLoading
                      ? (
                          <Skeleton className="w-12 h-4.5"></Skeleton>
                        )
                      : (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {user?.premium?.plan?.tier === 300
                              ? (
                                  <span className="flex items-center">
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="16"
                                      height="16"
                                      className="mr-1 fill-current"
                                    >
                                      <path d="M18.6,6.62C17.16,6.62 15.8,7.18 14.83,8.15L7.8,14.39C7.16,15.03 6.31,15.38 5.4,15.38C3.53,15.38 2,13.87 2,12C2,10.13 3.53,8.62 5.4,8.62C6.31,8.62 7.16,8.97 7.84,9.65L8.97,10.65L10.5,9.31L9.22,8.2C8.2,7.18 6.84,6.62 5.4,6.62C2.42,6.62 0,9.04 0,12C0,14.96 2.42,17.38 5.4,17.38C6.84,17.38 8.2,16.82 9.17,15.85L16.2,9.61C16.84,8.97 17.69,8.62 18.6,8.62C20.47,8.62 22,10.13 22,12C22,13.87 20.47,15.38 18.6,15.38C17.7,15.38 16.84,15.03 16.16,14.35L15,13.34L13.5,14.68L14.78,15.8C15.8,16.81 17.15,17.37 18.6,17.37C21.58,17.37 24,14.96 24,12C24,9.04 21.58,6.62 18.6,6.62Z" />
                                    </svg>
                                    coins
                                  </span>
                                )
                              : (
                                  <>
                                    {user?.coins.toLocaleString()}
                                    {' '}
                                    coins
                                  </>
                                )}
                          </span>
                        )}
                  </div>
                  {' '}
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className="flex gap-2 rounded-full cursor-pointer">
                        {isLoading
                          ? <Skeleton className="h-8 w-8 rounded-full p-0"></Skeleton>
                          : (
                              <Avatar className="h-8 w-8 rounded-full p-0">
                                <AvatarImage src={userAvatar} alt={user?.username} />
                                <AvatarFallback className="rounded-full">{user?.username?.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                            )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-[280px] sm:w-96 border-none p-0 backdrop-blur-xl bg-card rounded-2xl shadow-lg"
                    >
                      {isLoading
                        ? <Skeleton></Skeleton>
                        : <UserProfile updateAction={refetchUser} user={user} logoutAction={handleLogout} />}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Separator orientation="vertical" className="h-3" />
                  <WindowControls className="pr-4 py-2" />
                </div>
              </div>

              <AdminPanelLayout>
                <Dialog
                  open={isNoteDialogOpen}
                  onOpenChange={setIsNoteDialogOpen}
                >
                  <DialogContent
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      document.body.style.pointerEvents = '';
                    }}
                    className="sm:max-w-md"
                  >
                    <DialogHeader>
                      <DialogTitle>{noteText ? 'Edit Note' : 'Add Note'}</DialogTitle>
                      <DialogDescription>
                        Add a personal note about this account to help you remember important details.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Textarea
                        placeholder="Enter your note here..."
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        className="min-h-[100px] resize-none "
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsNoteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveNote} disabled={updateFavoriteNote.isPending}>
                        {updateFavoriteNote.isPending ? 'Saving...' : 'Save Note'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="p-6">
                  <Outlet />
                </div>
              </AdminPanelLayout>
            </div>
          </DefaultContextMenu>
        </ContextMenuProvider>
      </NotificationProvider>
    </>
  );
}
