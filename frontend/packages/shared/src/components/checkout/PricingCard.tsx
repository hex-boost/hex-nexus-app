import type { PlanWithPrice } from '@/features/payment/types/pricing.ts';
import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PremiumTiers } from '@/types/types.ts';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMembership } from '@/hooks/useMembership.tsx';
import { cn } from '@/lib/utils.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { currencySymbols } from './checkoutHelpers';

type PricingCardProps = {
  isDisabled?: boolean;
  className?: string;
  plan: PlanWithPrice;
  selectedCurrency: Currency;
  onCheckout: (plan: PlanWithPrice) => void;
  isLoading?: boolean;
  isSelected?: boolean;
};

// This mapping is an assumption based on the prompt's description of numeric tiers.
// Ideally, this would come from a shared configuration or the API.

export function PricingCard({ className, plan, selectedCurrency, onCheckout, isLoading = false, isSelected = false, isDisabled = false }: PricingCardProps) {
  const { user } = useUserStore();
  const { getBackgroundColor, getTierColorClass } = useMembership();
  const tierColor = getTierColorClass(plan.tier_enum);

  const renderIcon = (tier: PremiumTiers) => (
    <span className={`${getTierColorClass(tier).text} rounded-full bg-opacity-10 p-0.5`}>✓</span>
  );
  let tooltipMessage = '';
  if (isDisabled) {
    tooltipMessage = 'You can only upgrade your plan, not downgrade.';
  } else if (user?.premium.plan?.tier === 0) {
    tooltipMessage = 'The Free plan cannot be selected.';
  }

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

    // Apply the ".99" logic specifically for USD
    if (selectedCurrency === 'USD') {
      const mainPrice = Math.floor(plan.price / 100) - 1;
      return (
        <>
          <span className={`${tierColor.text} text-6xl font-bold`}>{mainPrice}</span>
          <span className={`${tierColor.text} text-4xl font-bold`}>.99</span>
        </>
      );
    }

    // For other currencies, format with two decimal places
    const formattedPrice = (plan.price / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const [integerPart, decimalPart] = formattedPrice.split('.');

    return (
      <>
        <span className={`${tierColor.text} text-6xl font-bold`}>{integerPart}</span>
        <span className={`${tierColor.text} text-4xl font-bold`}>
          .
          {decimalPart}
        </span>
      </>
    );
  };

  const checkoutButton = (
    <Button
      disabled={isDisabled}
      className={`w-full ${tierColor.bg} ${tierColor.hover} text-white py-3 rounded-md mt-6`}
      onClick={() => onCheckout(plan)}
    >
      {isSelected ? 'Selected' : plan.buttonText}
    </Button>
  );

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
      {tooltipMessage
        ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    {checkoutButton}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        : (
            checkoutButton
          )}
    </div>
  );
}
