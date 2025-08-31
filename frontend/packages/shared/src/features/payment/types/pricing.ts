import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PricingPlan } from '@/types/membership.ts';
import type { PremiumTiers } from '@/types/types.ts';

export type PlanWithPrice = PricingPlan & { price?: number };

export type PricingCardProps = {
  plan: PlanWithPrice;
  selectedCurrency: Currency;
  onCheckout: (plan: PricingPlan) => void;
  isLoading?: boolean;
};

export type UpgradeOptionsProps = {
  plans: PlanWithPrice[];
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  onCheckout: (plan: PricingPlan) => void;
  isLoading: boolean;
  error: Error | null;
  scrollToRef: React.RefObject<HTMLDivElement>;
  plansToDisplayFilter: (plan: { tier_enum: PremiumTiers }) => boolean;
};

export type ActivePlanProps = {
  plan: PlanWithPrice;
  selectedCurrency: Currency;
  onUpgradeClick: () => void;
};
