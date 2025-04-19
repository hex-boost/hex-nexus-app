import type { AccountType } from '@/types/types.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';

export function useAccountByID({ documentId, username }: { username?: string; documentId?: string }) {
  const {
    data: availableAccounts,
    isLoading: isAvailableLoading,
  } = useQuery({
    queryKey: ['accounts', 'available', documentId],
    queryFn: () => strapiClient.find<AccountType[]>('accounts/available', {
      filters: { documentId, username },
    }).then(res => res.data),
  });

  const {
    data: rentedAccounts,
    isLoading: isRentedLoading,
  } = useQuery({
    queryKey: ['accounts', 'rented'],
    queryFn: () => strapiClient.find<AccountType[]>('accounts/rented', {
      filters: { documentId, username },
    }).then(res => res.data),
  });
  return {
    availableAccounts,
    rentedAccounts,
    isAvailableLoading,
    isRentedLoading,
  };
}
