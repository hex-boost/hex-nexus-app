import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import type { PremiumTiers } from '@/types/types.ts';
import { create } from 'zustand';

type PremiumPaymentModalState = {
  isOpen: boolean;
  amount: number;
  tier: PremiumTiers;
  paymentMethod: PaymentMethodsAccepted;
  open: (data: { tier: PremiumTiers; paymentMethod: PaymentMethodsAccepted; amount: number }) => void;
  close: () => void;
};

export const usePremiumPaymentModalStore = create<PremiumPaymentModalState>(set => ({
  isOpen: false,
  tier: 'premium',
  paymentMethod: 'BR Balance',
  amount: 5000,
  open: data => set({ isOpen: true, ...data }),
  close: () => set({ isOpen: false }),
}));
