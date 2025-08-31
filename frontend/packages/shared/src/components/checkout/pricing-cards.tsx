import type { PlanWithPrice } from '@/features/payment/types/pricing.ts';
import type { PremiumTiers } from '@/types/types.ts';
import { useMembership } from '@/hooks/useMembership.tsx';
import { useMembershipPrices } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useMemo, useRef, useState } from 'react';
import { CheckoutPage } from '../CheckoutPage.tsx';
import { ActivePlan } from './ActivePlan';
import { UpgradeOptions } from './UpgradeOptions';

/**
 * Main component to display pricing cards, handle checkout flow,
 * and manage state for currency and plan selection.
 */
export default function PricingCards() {
  const pricingRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  const { pricingPlans: staticPricingPlans } = useMembership();
  const { pricesData, selectedCurrency, pricesError, pricesLoading, setSelectedCurrency } = useMembershipPrices();
  const [planForCheckout, setPlanForCheckout] = useState<PlanWithPrice | null>(null);

  const plansWithPrices: PlanWithPrice[] = useMemo(() => {
    return staticPricingPlans.map((plan) => {
      if (plan.tier_enum === 'free') {
        return { ...plan, price: 0 };
      }
      const priceFromApi = pricesData?.prices?.[plan.tier_enum.toLowerCase()];
      return { ...plan, price: priceFromApi };
    });
  }, [staticPricingPlans, pricesData]);

  const currentPlanDetails = useMemo(() => {
    if (!user?.premium?.plan?.name) {
      return undefined;
    }
    return plansWithPrices.find(plan => plan.tier_enum === user.premium.plan.name.toLowerCase());
  }, [plansWithPrices, user?.premium?.plan?.name]);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckout = (plan: PlanWithPrice) => {
    setPlanForCheckout(plan);
  };

  const handleBackFromCheckout = () => {
    setPlanForCheckout(null);
  };

  const plansToDisplayFilter = (plan: { tier_enum: PremiumTiers }) =>
    plan.tier_enum.toLowerCase() !== user?.premium?.plan?.name?.toLowerCase();

  if (planForCheckout) {
    return <CheckoutPage selectedPlan={planForCheckout} onBack={handleBackFromCheckout} />;
  }

  return (
    <div className="text-white flex flex-col items-center justify-center w-full p-4">
      {currentPlanDetails && (
        <ActivePlan
          plan={currentPlanDetails}
          selectedCurrency={selectedCurrency}
          onUpgradeClick={scrollToPricing}
        />
      )}
      <UpgradeOptions
        plans={plansWithPrices}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        onCheckout={handleCheckout}
        isLoading={pricesLoading}
        error={pricesError}
        scrollToRef={pricingRef as any}
        plansToDisplayFilter={plansToDisplayFilter}
      />
    </div>
  );
}
