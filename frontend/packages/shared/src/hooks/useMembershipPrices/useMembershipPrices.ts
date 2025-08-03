import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Plans = {

  basic: number;
  premium: number;
  pro: number;

};
export type Currency = 'EUR' | 'USD' | 'BRL';
export function useMembershipPrices() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const fetchPrices = async (currency: Currency): Promise<Plans> => {
    return await strapiClient.request<Plans>('GET', `/premium/prices/${currency}`);
  };
  const { data: pricesData, isLoading: pricesLoading, error: pricesError } = useQuery<Plans, Error>({
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
