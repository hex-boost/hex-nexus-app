import { CloseConfirmationHandler } from '@/components/CloseConfirmation.tsx';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { ErrorPage } from '@/components/error-page.tsx';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { UserProfile } from '@/components/UserProfile.tsx';
import { WindowControls } from '@/components/WindowControls.tsx';
import { useCommonFetch } from '@/hooks/useCommonFetch.ts';
import { Route as DashboardRoute } from '@/routes/_protected/dashboard/index.tsx';
import { useUserStore } from '@/stores/useUserStore';
import { createRootRouteWithContext, Outlet, redirect, useRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import React from 'react';
import { cls } from 'react-image-crop';

export type RouterContext = {
  auth: {
    isAuthenticated: () => boolean;
  };
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: ErrorPage,
  notFoundComponent: () => {
    return <div>Page not found</div>;
  },

  beforeLoad: async ({ location }) => {
    const isAuthenticated = useUserStore.getState().isAuthenticated();
    const isLoginRoute = location.pathname === '/login';
    if (!isAuthenticated && !isLoginRoute) {
      throw redirect({
        to: '/login',
      });
    }
    if (isAuthenticated && isLoginRoute) {
      throw redirect({
        to: DashboardRoute.fullPath,
      });
    }
    return { isAuthenticated };
  },
});

function RootLayout() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useUserStore();
  const { refetchUser, isUserLoading } = useCommonFetch();
  function handleLogout() {
    logout();
    router.navigate({ to: '/login' });
  }
  const isLoading = isAuthenticated() && isUserLoading;
  const userAvatar = import.meta.env.VITE_API_URL + user?.avatar?.url;
  return (
    <>
      <CloseConfirmationHandler />
      <div className="flex flex-col h-screen">
        <div
          className={cls(' bg-card border-b', isAuthenticated() && 'ml-[89px] ')}
          style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
        >
          <div className="flex justify-end items-center gap-6 py-2">

            {
              isAuthenticated()
              && (
                <>
                  <div
                    className="hidden sm:flex justify-center items-center gap-2  bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full"
                  >
                    <CoinIcon className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    {
                      isLoading
                        ? (
                            <Skeleton className="w-12 h-4.5"></Skeleton>
                          )
                        : (
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {user?.coins.toLocaleString()}
                              {' '}
                              coins
                            </span>
                          )
                    }
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div
                        className="flex gap-2  rounded-full cursor-pointer"
                      >
                        {

                          isLoading
                            ? <Skeleton className="h-8 w-8 rounded-full p-0"></Skeleton>
                            : (
                                <Avatar className="h-8 w-8 rounded-full p-0">
                                  <AvatarImage src={userAvatar} alt={user?.username} />
                                  <AvatarFallback
                                    className="rounded-full"
                                  >
                                    {user?.username.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              )
                        }
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-[280px] sm:w-96 border-none p-0 backdrop-blur-xl bg-card rounded-2xl shadow-lg"
                    >
                      {
                        isAuthenticated() && isLoading
                          ? <Skeleton></Skeleton>
                          : (
                              <UserProfile updateAction={refetchUser} user={user!} logoutAction={handleLogout} />
                            )
                      }
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )
            }
            {' '}
            <WindowControls className="px-4 py-2" />
          </div>
        </div>

        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  );
}
