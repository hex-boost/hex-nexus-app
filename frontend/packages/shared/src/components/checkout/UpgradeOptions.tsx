import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PremiumTiers, PricingPlan } from '@/types/types.ts';
import { useMembership } from '@/hooks/useMembership.ts';
import { CurrencySelector } from './CurrencySelector';
import { PricingCard } from './PricingCard';

type PlanWithPrice = PricingPlan & { price?: number };

type UpgradeOptionsProps = {
  plans: PlanWithPrice[];
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  onCheckout: (plan: PricingPlan) => void;
  isLoading: boolean;
  error: Error | null;
  scrollToRef: React.RefObject<HTMLDivElement>;
  plansToDisplayFilter: (plan: { tier_enum: PremiumTiers }) => boolean;
};

export function UpgradeOptions({
  plans,
  selectedCurrency,
  setSelectedCurrency,
  onCheckout,
  isLoading,
  error,
  scrollToRef,
  plansToDisplayFilter,
}: UpgradeOptionsProps) {
  const { pricingPlans } = useMembership();

  return (
    <div className="mt-8 text-center" ref={scrollToRef}>
      <div className="flex items-center justify-between w-full pb-4">
        <div className="flex flex-col items-start gap-1">
          <h3 className="text-2xl font-bold mb-2">Ready to go further?</h3>
          <p className="text-gray-400">Upgrade and outship the competition</p>
        </div>
        <CurrencySelector selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />
      </div>

      {error && !isLoading && (
        <p className="text-red-500">
          Error loading prices:
          {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {isLoading
          ? pricingPlans.filter(plansToDisplayFilter).map(plan => (
              <PricingCard
                key={`loading-${plan.tier_enum}`}
                plan={plan}
                selectedCurrency={selectedCurrency}
                onCheckout={onCheckout}
                isLoading={true}
              />
            ))
          : plans.filter(plansToDisplayFilter).map(plan => (
              <PricingCard
                key={`loaded-${plan.tier_enum}`}
                plan={plan}
                selectedCurrency={selectedCurrency}
                onCheckout={onCheckout}
              />
            ))}
      </div>
    </div>
  );
}
