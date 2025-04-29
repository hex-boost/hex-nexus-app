import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout.tsx';
// frontend/src/routes/_protected.tsx
import {CloseConfirmationHandler} from '@/components/CloseConfirmation.tsx';
import {CoinIcon} from '@/components/coin-icon.tsx';
import {DefaultContextMenu} from '@/components/DefaultContextMenu.tsx';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar.tsx';
import {Button} from '@/components/ui/button.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx';
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from '@/components/ui/dropdown-menu.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {Skeleton} from '@/components/ui/skeleton.tsx';
import {Textarea} from '@/components/ui/textarea.tsx';
import {WindowControls} from '@/components/WindowControls.tsx';
import {ContextMenuProvider} from '@/contexts/ContextMenuContext.tsx';
import {NotificationProvider} from '@/features/notification/notification-provider.tsx';
import {NotificationBell} from '@/features/notification/NotificationBell.tsx';
import {UserProfile} from '@/features/user-profile/UserProfile.tsx';
import {useCommonFetch} from '@/hooks/useCommonFetch.ts';
import {useFavoriteAccounts} from '@/hooks/useFavoriteAccounts.ts';
import {useUserStore} from '@/stores/useUserStore';
import {createFileRoute, Outlet, useRouter} from '@tanstack/react-router';
import React from 'react';
import {cls} from 'react-image-crop';
import 'non.geist';

export const Route = createFileRoute('/_protected')({
  component: DashboardLayout,
});

function DashboardLayout() {
  const router = useRouter();
  const { logout, user } = useUserStore();
  const { isUserLoading, refetchUser } = useCommonFetch();

  function handleLogout() {
    logout();
    router.navigate({ to: '/login' });
  }

  const isLoading = isUserLoading;
  const userAvatar = import.meta.env.VITE_API_URL + user?.avatar?.url;

  const { updateFavoriteNote, isNoteDialogOpen, setIsNoteDialogOpen, noteText, setNoteText, handleSaveNote } = useFavoriteAccounts();

  return (
    <>

      {/*<AppleStyleDock />*/}
      <CloseConfirmationHandler />

      <NotificationProvider>
        <ContextMenuProvider>
          <DefaultContextMenu>
            <div className="flex flex-col h-screen bg-background">

              <div
                className={cls('sticky top-0 z-50  backdrop-blur-md bg-black/20 border-b ml-[89px]')}
                style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
              >
                <div className="grid grid-flow-col justify-end items-center gap-4 py-2">
                  <div className="hidden sm:flex justify-center items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full">
                    <CoinIcon className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    {isLoading
                      ? <Skeleton className="w-12 h-4.5"></Skeleton>
                      : (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {user?.coins.toLocaleString()}
                            {' '}
                            coins
                          </span>
                        )}

                  </div>
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className="flex gap-2 rounded-full cursor-pointer">
                        {isLoading
                          ? <Skeleton className="h-8 w-8 rounded-full p-0"></Skeleton>
                          : (
                              <Avatar className="h-8 w-8 rounded-full p-0">
                                <AvatarImage src={userAvatar} alt={user?.username} />
                                <AvatarFallback className="rounded-full">{user?.username.slice(0, 2)}</AvatarFallback>
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
