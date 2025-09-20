import type { PaymentsData } from '@/features/payment/types/usePayments.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';

export function usePaymentsQuery() {
  return useQuery({
    queryKey: ['payments', 'user'],
    queryFn: async () => {
      return await strapiClient.request<PaymentsData>('get', 'users/payments');
    },
  });
}
