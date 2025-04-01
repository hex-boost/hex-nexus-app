import type { UserType } from '@/types/types.ts';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useQuery } from '@tanstack/react-query';

export function useCommonFetch() {
  const { isAuthenticated, setUser } = useUserStore();
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useQuery<UserType, StrapiError>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const user = await strapiClient.request<UserType>('get', 'users/me');
      setUser(user);
      return user;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated(),
  },

  );

  return {
    isUserLoading,
    user,
    refetchUser,
  };
}
