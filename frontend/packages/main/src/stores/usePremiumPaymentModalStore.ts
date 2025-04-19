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
  paymentMethod: 'Stripe',
  amount: 0,
  open: data => set({ isOpen: true, ...data }),
  close: () => set({ isOpen: false }),
}));
