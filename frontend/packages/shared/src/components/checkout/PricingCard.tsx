import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PremiumTiers, PricingPlan } from '@/types/types.ts';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useMembership } from '@/hooks/useMembership.ts';
import { cn } from '@/lib/utils.ts';
import { currencySymbols } from './checkoutHelpers';

type PlanWithPrice = PricingPlan & { price?: number };

type PricingCardProps = {
  className?: string;
  plan: PlanWithPrice;
  selectedCurrency: Currency;
  onCheckout: (plan: PricingPlan) => void;
  isLoading?: boolean;
  isSelected?: boolean; // New prop
};

export function PricingCard({ className, plan, selectedCurrency, onCheckout, isLoading = false, isSelected = false }: PricingCardProps) {
  const { getBackgroundColor, getTierColorClass } = useMembership();
  const tierColor = getTierColorClass(plan.tier_enum);

  const renderIcon = (tier: PremiumTiers) => (
    <span className={`${getTierColorClass(tier).text} rounded-full bg-opacity-10 p-0.5`}>✓</span>
  );

  const renderPrice = () => {
    if (isLoading) {
      return <Skeleton className="h-14 w-24 rounded mx-1" />;
    }
    if (plan.price === undefined) {
      return <span className={`${tierColor.text} text-lg`}>N/A</span>;
    }
    if (plan.price === 0) {
      return <span className={`${tierColor.text} text-6xl font-bold mx-1`}>0</span>;
    }
    if (selectedCurrency === 'USD' && plan.price >= 1) {
      return (
        <>
          <span className={`${tierColor.text} text-6xl font-bold mx-1`}>{Math.floor(plan.price / 100) - 1}</span>
          <span className={`${tierColor.text} text-4xl font-bold -ml-1`}>.99</span>
        </>
      );
    }
    return <span className={`${tierColor.text} text-6xl font-bold mx-1`}>{plan.price / 100}</span>;
  };

  return (
    <div className={cn(`${getBackgroundColor(plan.tier_enum)} rounded-xl p-6 text-left border ${isSelected ? 'border-purple-400' : tierColor.border}`, className)}>
      <h3 className={`text-2xl font-bold ${tierColor.text} mb-2`}>{plan.tier}</h3>
      <p className="text-gray-400 mb-6">{plan.description}</p>
      <div className="flex items-baseline mb-2">
        <span className={`${tierColor.text} text-2xl`}>{currencySymbols[selectedCurrency]}</span>
        {renderPrice()}
        {plan.period && <span className={`${tierColor.text} text-xl ml-1`}>{plan.period}</span>}
      </div>
      <div className={`border-t ${tierColor.border} my-4`} />
      <ul className="space-y-4">
        {plan.benefits.map((benefit, idx) => (
          <li key={`benefit-${plan.tier_enum}-${idx}`} className="flex items-center gap-2">
            {renderIcon(plan.tier_enum)}
            <span className={benefit.icon === 'gift' ? tierColor.text : 'text-gray-300'}>{benefit.title}</span>
            {benefit.isNew && <Badge className={`${tierColor.bg} text-white text-xs px-1.5 py-0.5 rounded`}>New!</Badge>}
          </li>
        ))}
      </ul>
      <Button
        disabled={isLoading || (plan.price === undefined && plan.tier_enum !== 'free') || isSelected}
        className={`w-full ${tierColor.bg} ${tierColor.hover} text-white py-3 rounded-md mt-6`}
        onClick={() => onCheckout(plan as PricingPlan)}
      >
        {isSelected ? 'Selected' : plan.buttonText}
      </Button>
    </div>
  );
}
