import type { UserType } from '@/types/types.ts';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';

import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { LoginForm } from '@/components/login-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';

import { UserProfile } from '@/components/UserProfile.tsx';
import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore';
import { useQuery } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GetCurrentVersion } from '../../wailsjs/go/updater/updater';
import { GetHWID } from '../../wailsjs/go/utils/hwid';

export type RouterContext = {
  auth: {
    isAuthenticated: () => boolean;
  };
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: DashboardLayout,
  beforeLoad: async ({ context }) => {
    // Check authentication status before route loads
    const isAuthenticated = context.auth.isAuthenticated();
    return { isAuthenticated };
  },
});

function DashboardLayout() {
  const { navigate } = useRouter();
  const { isAuthenticated, logout, setUser } = useUserStore();

  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const versionData = await GetCurrentVersion();
        setVersion(versionData);
      } catch (error) {
        console.error('Failed to get version:', error);
      }
    };

    fetchVersion();
  }, []);
  const {
    data: user,
    isLoading: isUserLoading,
    isError,
    error,
    refetch: refetchUser,
  } = useQuery<UserType, StrapiError>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const user = await strapiClient.request<UserType>('get', 'users/me');
      const clientHWID = await GetHWID();
      if (user?.hwid !== clientHWID) {
        toast.error('The HWID of this client does not match the HWID of the user account. Please contact support if you think this is a mistake.');
        logout();
        navigate({ to: '/login' });
      }
      logout();
      setUser(user);
      return user;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated(),
  },
  );
  if (isError) {
    if ([401, 403].includes(error.error?.status)) {
      logout();
      navigate({ to: '/' });
    }
  }
  const isLoading = isAuthenticated() && isUserLoading;
  const userAvatar = import.meta.env.VITE_BACKEND_URL + user?.avatar.url;
  return (
    <>

      <span>{version}</span>
      {isAuthenticated()
        ? (
            <AdminPanelLayout>
              <div className="px-6 gap-6 py-4 bg-black/20 border-b w-full flex justify-end">
                <div
                  className="hidden sm:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full"
                >
                  <CoinIcon className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  {
                    isLoading
                      ? (
                          <Skeleton className="w-12 h-4.5"></Skeleton>
                        )
                      : (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {user!.coins.toLocaleString()}
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
                      isLoading
                        ? <Skeleton></Skeleton>
                        : (
                            <UserProfile updateAction={refetchUser} user={user!} logoutAction={logout} />
                          )
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-6 ">
                <Outlet />
              </div>
            </AdminPanelLayout>
          )
        : (
            <div className="flex items-center justify-center bg-background">
              <LoginForm />
            </div>
          )}
    </>
  );
}
