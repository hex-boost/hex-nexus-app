import type { Price, PriceData } from '@/types/price.ts';
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

  const hours = [1, 3, 6];
  function getAccountPrice(price: Price, elo?: string) {
    const baseElo = elo && elo !== '' ? elo : 'Unranked';
    const baseEloUpperCase = baseElo.charAt(0).toUpperCase() + baseElo.slice(1).toLowerCase();
    const basePrice = price.league[baseEloUpperCase] || 105; // Default to Unranked price instead of 666

    // Map the hours correctly to the multipliers
    return price.timeMultipliers.map((percentage, index) => ({
      hours: hours[index], // Use the predefined hours array
      price: percentage === 0 ? basePrice : basePrice * (1 + percentage / 100),
    }));
  }

  return { getAccountPrice, price, isPriceLoading };
}
