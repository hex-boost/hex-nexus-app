import type { UserType } from '@/types/types.ts';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { useGoFunctions } from '@/hooks/useGoBindings.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useQuery } from '@tanstack/react-query';

import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

export function useCommonFetch() {
  const { Utils } = useGoFunctions();
  const router = useRouter();
  const { isAuthenticated, setUser, logout } = useUserStore();
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useQuery<UserType, StrapiError>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const user = await strapiClient.request<UserType>('get', 'users/me');
      if (import.meta.env.VITE_NODE_ENV !== 'development') {
        if (user.hwid !== await Utils.GetHWID()) {
          logout();
          toast.error('You have been logged out due to HWID mismatch');
          router.navigate({ to: '/login' });
          throw new Error('HWID mismatch');
        }
      }

      setUser(user);
      return user;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  },

  );

  return {
    isUserLoading,
    user,
    refetchUser,
  };
}
