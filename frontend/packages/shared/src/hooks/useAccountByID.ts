import type { AccountWithPrice } from '@/features/accounts-table/hooks/useAccounts.tsx';
import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';

export function useAccountByID({ documentId }: { username?: string; documentId?: string }) {
  const {
    data: accountById,
    isLoading: isAvailableLoading,
  } = useQuery({
    queryKey: ['accounts', 'rental-options', documentId],
    queryFn: () => strapiClient.request<AccountWithPrice>('get', `accounts/${documentId}/rental-options`, {}).then(res => res),
  });

  return {
    accountById,
    isAvailableLoading,
  };
}
