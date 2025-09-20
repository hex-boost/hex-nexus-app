import type { PremiumTiers } from '@/types/types.ts';
import { PaymentMethodEnum } from '@/types/membership.ts';
import { create } from 'zustand';

type Currencies = 'USD' | 'BRL' | 'EUR';
type PremiumPaymentModalState = {
  isOpen: boolean;
  amount: number;
  tier: PremiumTiers;
  currency: Currencies;
  paymentMethod: PaymentMethodEnum;
  open: (data: { tier: PremiumTiers; paymentMethod: PaymentMethodEnum; amount: number; currency: Currencies }) => void;
  close: () => void;
};

export const usePremiumPaymentModalStore = create<PremiumPaymentModalState>(set => ({
  isOpen: false,
  currency: 'USD',
  tier: 'premium',
  paymentMethod: PaymentMethodEnum.BoostRoyal,
  amount: 5000,
  open: data => set({ isOpen: true, ...data }),
  close: () => set({ isOpen: false }),
}));
