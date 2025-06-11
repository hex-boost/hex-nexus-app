import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export type Currency = 'EUR' | 'USD' | 'BRL';
export function useMembershipPrices() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const fetchPrices = async (currency: Currency): Promise<Record<string, number>> => {
    // Assuming the API returns an object matching the structure expected by pricesData?.[plan.tier_enum.toLowerCase()]
    return await strapiClient.request<Record<string, number>>('GET', `/premium/prices/${currency}`);
  };
  const { data: pricesData, isLoading: pricesLoading, error: pricesError } = useQuery<Record<string, number>, Error>({
    queryKey: ['prices', selectedCurrency],
    queryFn: () => fetchPrices(selectedCurrency),
    staleTime: 1000 * 60 * 5, // Cache prices for 5 minutes
  });
  return {
    selectedCurrency,
    setSelectedCurrency,
    pricesData,
    pricesLoading,
    pricesError,
  };
}
