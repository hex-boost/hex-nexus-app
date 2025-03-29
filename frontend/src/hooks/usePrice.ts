// hooks/usePrice.ts
import type { PriceData } from '@/types/price.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';

export function usePrice() {
  const { data: price, isLoading: isPriceLoading } = useQuery({
    queryKey: ['price'],
    queryFn: async () => {
      const res = await strapiClient.request<PriceData>('get', 'price');
      return res.data;
    },
  });

  return { price, isPriceLoading };
}
