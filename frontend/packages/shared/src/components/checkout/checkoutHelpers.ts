import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';

export const currencySymbols: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  BRL: 'R$',
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
