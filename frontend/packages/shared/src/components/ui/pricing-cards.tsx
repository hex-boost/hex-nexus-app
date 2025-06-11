import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PremiumTiers } from '@/types/types.ts'; // Assuming PremiumTiers is 'free' | 'basic' | 'premium' | 'pro'
import { FlickeringGrid } from '@/components/magicui/flickering-grid.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentMethodDialog } from '@/features/payment/PaymentMethodDialog.tsx';
import { useMembership } from '@/hooks/useMembership.ts';
import { useMembershipPrices } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { ArrowDownCircle, CircleCheckBig, UserCircle } from 'lucide-react'; // Added UserCircle for fallback
import { useMemo, useRef } from 'react';

// Define available currencies and their symbols
const currencySymbols: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  BRL: 'R$',
};
export type Prices = {
  basic: number;
  premium: number;
  pro: number;
};
// Function to fetch prices from the API

export default function PricingCards() {
  const pricingRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  const { getBackgroundColor, getTierColorClass, pricingPlans: staticPricingPlans } = useMembership();
  const { pricesData, selectedCurrency, pricesError, pricesLoading, setSelectedCurrency } = useMembershipPrices();
  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const plansWithPrices = useMemo(() => {
    return staticPricingPlans.map((plan) => {
      if (plan.tier_enum === 'free') {
        return { ...plan, price: 0 };
      }
      const priceFromApi = pricesData?.[plan.tier_enum.toLowerCase()];
      return {
        ...plan,
        price: priceFromApi, // price will be undefined if not found or while loading
      };
    });
  }, [staticPricingPlans, pricesData]);

  const currentPlanDetails = useMemo(() => {
    if (!user?.premium?.tier) {
      return undefined;
    }
    return plansWithPrices.find(plan => plan.tier_enum === user.premium.tier.toLowerCase());
  }, [plansWithPrices, user?.premium?.tier]);

  const renderIcon = (tier: PremiumTiers) => {
    const colorClass = getTierColorClass(tier);
    // Assuming getTierColorClass returns { text: 'some-tailwind-class' }
    return <span className={`${colorClass.text} rounded-full bg-opacity-10 p-0.5`}>✓</span>;
  };

  // Updated filter to hide the current plan from the list of upgrade options
  const plansToDisplayFilter = (plan: { tier_enum: PremiumTiers }) =>
    plan.tier_enum.toLowerCase() !== user?.premium?.tier?.toLowerCase();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="text-white flex flex-col items-center justify-center w-full p-4">
      <div className="w-full ">
        <div className="flex justify-between items-center mb-6 relative">
          <div className="absolute -z-10 left-0 top-1/2 transform -translate-y-1/2">
            <div className="flex gap-1.5">
              {[...Array.from({ length: 6 })].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-700" />
              ))}
            </div>
          </div>
          <h2 className="text-2xl font-bold">Active Plan</h2>
          <Button
            variant="ghost"
            className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
            onClick={scrollToPricing}
          >
            <ArrowDownCircle
              className="h-5 w-5 rounded-full bg-purple-400/20 flex items-center justify-center "
            />
            View Upgrade Options
          </Button>
        </div>

        {currentPlanDetails && (
          <div
            className={`${getTierColorClass(currentPlanDetails.tier_enum).bgLight} rounded-xl px-8 pb-8 pt-16 flex flex-col items-center relative overflow-hidden`}
          >

            <div className="absolute flex items-center justify-between gap-4 left-0 px-8 top-8  border-gray-700 w-full">
              <div>
                {currentPlanDetails.price !== undefined
                  ? (
                      <div className="flex items-baseline">
                        {
                          currentPlanDetails.price > 0
                          && (
                            <span className={`${getTierColorClass(currentPlanDetails.tier_enum).text} text-lg`}>
                              {currencySymbols[selectedCurrency]}
                            </span>
                          )
                        }
                        {currentPlanDetails.price === 0
                          ? (
                              <span className={`${getTierColorClass(currentPlanDetails.tier_enum).text} text-3xl font-bold mx-1`}>
                                Free
                              </span>
                            )
                          : selectedCurrency === 'USD' && currentPlanDetails.price >= 1
                            ? (
                                <>
                                  <span className={`${getTierColorClass(currentPlanDetails.tier_enum).text} text-3xl font-bold mx-1`}>
                                    {Math.floor(currentPlanDetails.price) - 1}
                                  </span>
                                  <span className={`${getTierColorClass(currentPlanDetails.tier_enum).text} text-xl font-bold -ml-1`}>
                                    .99
                                  </span>
                                </>
                              )
                            : (
                                <span className={`${getTierColorClass(currentPlanDetails.tier_enum).text} text-3xl font-bold mx-1`}>
                                  {currentPlanDetails.price.toFixed(2)}
                                </span>
                              )}
                        {currentPlanDetails.price > 0 && currentPlanDetails.period && (
                          <span className="text-gray-400 text-sm ml-1">
                            /
                            {' '}
                            {currentPlanDetails.period.toLowerCase()}
                          </span>
                        )}
                      </div>
                    )
                  : (
                      <p className="text-gray-500">N/A</p>
                    )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ">
                <div className="border rounded-md py-2 px-4">
                  <p className="font-semibold text-gray-300 mb-1">Next Coin Distribution</p>
                  <p className="text-gray-400 text-right font-medium">
                    {user?.premium?.coinDistributionCycleAnchorDate
                      ? `Cycle starts: ${formatDate(user.premium.coinDistributionCycleAnchorDate)}`
                      : user?.premium?.lastCoinDistributionDate
                        ? `Last: ${formatDate(user.premium.lastCoinDistributionDate)} (Cycle info N/A)`
                        : 'Not available'}
                  </p>
                </div>
                <div className="md:text-right border rounded-md p-2">
                  <p className="font-semibold text-gray-300 mb-1">Subscription Expires</p>
                  <p className="text-gray-400 font-medium">
                    {formatDate(user?.premium?.expiresAt)}
                  </p>
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
                    <UserCircle className="w-16 h-16 text-gray-400" /> // Fallback Icon
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
              {currentPlanDetails.tier}
              {' '}
              Plan
            </h1>
            <p className="text-gray-400 text-center max-w-lg mb-4">
              {currentPlanDetails.description}
              {currentPlanDetails.tier_enum === 'free' && ' As a member of the Free Plan, you have access to:'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentPlanDetails.benefits.map((benefit, idx) => (
                <div
                  key={`current-benefit-${currentPlanDetails.tier_enum}-${idx}`}
                  className={`${getTierColorClass(currentPlanDetails.tier_enum).text} ${getTierColorClass(currentPlanDetails.tier_enum).glow} rounded-lg p-4 flex items-center gap-3`}
                >
                  <CircleCheckBig strokeWidth={2} className="h-6 w-6 " />
                  <span className=" text-sm">{benefit.title}</span>
                </div>
              ))}
            </div>

            {/* New section for Price, Expiration, and Coin Distribution */}
          </div>
        )}

        <div className="mt-8 text-center" ref={pricingRef}>
          <div className="flex items-center justify-between w-full pb-4">
            <div className="flex flex-col items-start gap-1">
              <h3 className="text-2xl font-bold mb-2">Ready to go further?</h3>
              <p className="text-gray-400 ">Upgrade and outship the competition</p>
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="currency-select" className="text-gray-400">Currency:</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value: string) => setSelectedCurrency(value as Currency)}
              >
                <SelectTrigger id="currency-select" className="w-[100px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {(['USD', 'EUR', 'BRL'] as Currency[]).map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pricesError && !pricesLoading && (
            <p className="text-red-500">
              Error loading prices:
              {' '}
              {pricesError.message}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {pricesLoading
              ? (
                  staticPricingPlans
                    .filter(plansToDisplayFilter)
                    .map(plan => (
                      <div
                        key={`loading-plan-${plan.tier_enum}`}
                        className={`${getBackgroundColor(plan.tier_enum)} rounded-xl p-6 text-left border ${getTierColorClass(plan.tier_enum).border}`}
                      >
                        <div className="flex items-center gap-1">
                          <h3 className={`text-2xl font-bold ${getTierColorClass(plan.tier_enum).text} mb-2`}>{plan.tier}</h3>
                        </div>
                        <p className="text-gray-400 mb-4">{plan.description}</p>

                        <div className="flex items-baseline mb-1">
                          <span className={`${getTierColorClass(plan.tier_enum).text} text-2xl`}>
                            {currencySymbols[selectedCurrency]}
                          </span>
                          <Skeleton className="h-14 w-24 rounded mx-1" />
                          {plan.period && (
                            <div className="flex relative flex-col ml-1">
                              <span className={`${getTierColorClass(plan.tier_enum).text} text-xl`}>
                                {plan.period}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={`border-t ${getTierColorClass(plan.tier_enum).border} my-4`}></div>

                        <ul className="space-y-4">
                          {plan.benefits.map((benefit, idx) => (
                            <li key={`static-benefit-${plan.tier_enum}-${idx}`} className="flex items-center gap-2">
                              {renderIcon(plan.tier_enum)}
                              <span
                                className={benefit.icon === 'gift' ? getTierColorClass(plan.tier_enum).text : 'text-gray-300'}
                              >
                                {benefit.title}
                              </span>
                              {benefit.isNew && (
                                <Badge
                                  className={`${getTierColorClass(plan.tier_enum).bg} text-white text-xs px-1.5 py-0.5 rounded`}
                                >
                                  New!
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>

                        <PaymentMethodDialog selectedTier={plan.tier_enum}>
                          <Button
                            disabled={plan.tier_enum !== 'free'}
                            className={`w-full ${getTierColorClass(plan.tier_enum).bg} ${getTierColorClass(plan.tier_enum).hover} text-white py-3 rounded-md mt-6`}
                          >
                            {plan.buttonText}
                          </Button>
                        </PaymentMethodDialog>
                      </div>
                    ))
                )
              : (
                  plansWithPrices
                    .filter(plansToDisplayFilter)
                    .map(plan => (
                      <div
                        key={plan.tier_enum}
                        className={`${getBackgroundColor(plan.tier_enum)} rounded-xl p-6 text-left border ${getTierColorClass(plan.tier_enum).border}`}
                      >
                        <div className="flex items-center gap-1">
                          <h3 className={`text-2xl font-bold ${getTierColorClass(plan.tier_enum).text} mb-2`}>{plan.tier}</h3>
                        </div>
                        <p className="text-gray-400 mb-6">{plan.description}</p>

                        <div className="flex items-baseline mb-2">
                          <span
                            className={`${getTierColorClass(plan.tier_enum).text} text-2xl`}
                          >
                            {currencySymbols[selectedCurrency]}
                          </span>
                          {plan.price === undefined && !pricesError && (
                            <span
                              className={`${getTierColorClass(plan.tier_enum).text} text-lg`}
                            >
                              N/A
                            </span>
                          )}
                          {plan.price === undefined && pricesError && (
                            <span
                              className={`${getTierColorClass(plan.tier_enum).text} text-lg`}
                            >
                              ...
                            </span>
                          )}

                          {plan.price !== undefined && (
                            plan.price === 0
                              ? (
                                  <span
                                    className={`${getTierColorClass(plan.tier_enum).text} text-6xl font-bold mx-1`}
                                  >
                                    0
                                  </span>
                                )
                              : (
                                  <>
                                    {selectedCurrency === 'USD'
                                      ? (
                                          plan.price >= 1 // Guard for charm pricing
                                            ? (
                                                <>
                                                  <span
                                                    className={`${getTierColorClass(plan.tier_enum).text} text-6xl font-bold mx-1`}
                                                  >
                                                    {Math.floor(plan.price) - 1}
                                                  </span>
                                                  <span
                                                    className={`${getTierColorClass(plan.tier_enum).text} text-4xl font-bold -ml-1`}
                                                  >
                                                    .99
                                                  </span>
                                                </>
                                              )
                                            : ( // Fallback for USD prices < 1 or if charm pricing is not applicable
                                                <span className={`${getTierColorClass(plan.tier_enum).text} text-6xl font-bold mx-1`}>
                                                  {plan.price.toFixed(2)}
                                                </span>
                                              )
                                        )
                                      : ( // For other currencies
                                          <span className={`${getTierColorClass(plan.tier_enum).text} text-6xl font-bold mx-1`}>
                                            {plan.price.toFixed(2)}
                                          </span>
                                        )}
                                  </>
                                )
                          )}
                          {plan.period && (
                            <div className="flex relative flex-col ml-1">
                              <span
                                className={`${getTierColorClass(plan.tier_enum).text} text-xl`}
                              >
                                {plan.period}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={`border-t ${getTierColorClass(plan.tier_enum).border} my-4`}></div>

                        <ul className="space-y-4">
                          {plan.benefits.map((benefit, idx) => (
                            <li key={`loaded-benefit-${plan.tier_enum}-${idx}`} className="flex items-center gap-2">
                              {renderIcon(plan.tier_enum)}
                              <span
                                className={benefit.icon === 'gift' ? getTierColorClass(plan.tier_enum).text : 'text-gray-300'}
                              >
                                {benefit.title}
                              </span>
                              {benefit.isNew && (
                                <Badge
                                  className={`${getTierColorClass(plan.tier_enum).bg} text-white text-xs px-1.5 py-0.5 rounded`}
                                >
                                  New!
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>

                        <PaymentMethodDialog selectedTier={plan.tier_enum}>
                          <Button
                            disabled={plan.price === undefined && plan.tier_enum !== 'free'}
                            className={`w-full ${getTierColorClass(plan.tier_enum).bg} ${getTierColorClass(plan.tier_enum).hover} text-white py-3 rounded-md mt-6`}
                          >
                            {plan.buttonText}
                          </Button>
                        </PaymentMethodDialog>
                      </div>
                    ),
                    ))}
          </div>
        </div>
      </div>
    </div>
  );
}
