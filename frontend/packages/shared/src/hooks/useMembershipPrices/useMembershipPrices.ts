// --- START OF FILE useMembershipPrices.ts ---

import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export type Discount = {
  type: string;
  value: number;
  isPercentage: boolean;
};

export type Plans = {
  currency: string;
  desiredMonths: number;
  prices: Prices;
};
type Prices = {

  basic: number;
  premium: number;
  pro: number;
  discounts?: Discount[];

};
export type Currency = 'EUR' | 'USD' | 'BRL';
export function useMembershipPrices(months: number, discountCode?: string) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const fetchPrices = async (currency: Currency, months: number, discountCode?: string): Promise<Plans> => {
    const queryParams = new URLSearchParams();
    queryParams.append('months', months.toString());
    if (discountCode) {
      queryParams.append('discountCode', discountCode);
    }
    // TODO: Add discordId to the request
    // queryParams.append('discordId', '191308036915068929');
    return await strapiClient.request<Plans>('GET', `/premium/prices/${currency}/v1?${queryParams.toString()}`);
  };
  const { data: pricesData, isLoading: pricesLoading, error: pricesError } = useQuery<Plans, Error>({
    queryKey: ['prices', selectedCurrency, months, discountCode],
    queryFn: () => fetchPrices(selectedCurrency, months, discountCode),
    staleTime: 1000 * 60 * 5, // Cache prices for 5 minutes
    enabled: months > 0, // Only fetch if months is positive
  });
  return {
    selectedCurrency,
    setSelectedCurrency,
    pricesData,
    pricesLoading,
    pricesError,
  };
}
// --- END OF FILE useMembershipPrices.ts ---
