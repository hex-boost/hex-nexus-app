import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PricingPlan } from '@/types/membership';
import { FlickeringGrid } from '@/components/magicui/flickering-grid.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useMembership } from '@/hooks/useMembership.tsx';
import { useUserStore } from '@/stores/useUserStore.ts';
import { ArrowDownCircle, CircleCheckBig, UserCircle } from 'lucide-react';
import { currencySymbols, formatDate } from './checkoutHelpers';

type PlanWithPrice = PricingPlan & { price?: number };

type ActivePlanProps = {
  plan: PlanWithPrice;
  selectedCurrency: Currency;
  onUpgradeClick: () => void;
};

export function ActivePlan({ plan, selectedCurrency, onUpgradeClick }: ActivePlanProps) {
  const { user } = useUserStore();
  const { getTierColorClass } = useMembership();
  const tierColor = getTierColorClass(plan.tier_enum);

  const renderPrice = () => {
    if (plan.price === undefined) {
      return <p className="text-gray-500">N/A</p>;
    }
    if (plan.price === 0) {
      return <span className={`${tierColor.text} text-3xl font-bold mx-1`}>Free</span>;
    }
    return (
      <div className="flex items-baseline">
        <span className={`${tierColor.text} text-lg`}>{currencySymbols[selectedCurrency]}</span>
        {selectedCurrency === 'USD' && plan.price >= 1
          ? (
              <>
                <span
                  className={`${tierColor.text} text-3xl font-bold mx-1`}
                >
                  {Math.floor(plan.price / 100) - 1}
                </span>
                <span className={`${tierColor.text} text-xl font-bold -ml-1`}>.99</span>
              </>
            )
          : (
              <span className={`${tierColor.text} text-3xl font-bold mx-1`}>{(plan.price / 100).toFixed(2)}</span>
            )}
        {plan.period && <span className="text-gray-400 text-sm ml-1">{plan.period.toLowerCase()}</span>}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Plan</h2>
        <Button variant="ghost" className="text-purple-400 hover:text-purple-300 flex items-center gap-2" onClick={onUpgradeClick}>
          <ArrowDownCircle className="h-5 w-5 rounded-full bg-purple-400/20" />
          View Upgrade Options
        </Button>
      </div>

      <div className={`${tierColor.bgLight} rounded-xl px-8 pb-8 pt-16 flex flex-col items-center relative overflow-hidden`}>
        <div className="absolute flex items-center justify-between gap-4 left-0 px-8 top-8 w-full">
          <div>{renderPrice()}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="border rounded-md py-2 px-4">
              <p className="font-semibold text-gray-300 mb-1">Next Coin Distribution</p>
              <p className="text-gray-400 text-right font-medium">
                {user?.premium?.coinDistributionCycleAnchorDate
                  ? formatDate(user.premium.coinDistributionCycleAnchorDate)
                  : 'Not available'}
              </p>
            </div>
            <div className="md:text-right border rounded-md p-2">
              <p className="font-semibold text-gray-300 mb-1">Subscription Expires</p>
              <p className="text-gray-400 font-medium">{formatDate(user?.premium?.expiresAt)}</p>
            </div>
          </div>
        </div>

        <div className="w-24 h-24 rounded-full mb-6 overflow-hidden bg-gray-600 flex items-center justify-center">
          {user?.avatar?.url
            ? (
                <img
                  src={import.meta.env.VITE_API_URL + user.avatar.url}
                  alt="Profile avatar"
                  width={100}
                  height={100}
                  className="object-cover w-full h-full"
                />
              )
            : (
                <UserCircle className="w-16 h-16 text-gray-400" />
              )}
        </div>
        <FlickeringGrid
          className="absolute h-8/12 w-full opacity-50 inset-0 z-0 pointer-events-none"
          squareSize={1.8}
          gridGap={20}
          color="#ffffff"
          maxOpacity={0.12}
          flickerChance={0.1}
        />

        <h1 className="text-3xl font-bold mb-4 text-center">
          You're on the
          {' '}
          {plan.tier}
          {' '}
          Plan
        </h1>
        <p className="text-gray-400 text-center max-w-lg mb-4">{plan.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {plan.benefits.map((benefit, idx) => (
            <div
              key={`current-benefit-${plan.tier_enum}-${idx}`}
              className={`${tierColor.text} ${tierColor.glow} rounded-lg p-4 flex items-center gap-3`}
            >
              <CircleCheckBig strokeWidth={2} className="h-6 w-6" />
              <span className="text-sm">{benefit.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
