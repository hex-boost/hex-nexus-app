import type { PremiumTiers } from '@/types/types.ts';
import { FlickeringGrid } from '@/components/magicui/flickering-grid.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button';
import { PaymentMethodDialog } from '@/features/payment/PaymentMethodDialog.tsx';
import { useMembership } from '@/hooks/useMembership.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { ArrowDownCircle, CircleCheckBig } from 'lucide-react';
import { useRef } from 'react';

export default function PricingCards() {
  const pricingRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  const { getBackgroundColor, getTierColorClass, pricingPlans } = useMembership();
  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderIcon = (tier: PremiumTiers) => {
    const colorClass = getTierColorClass(tier);
    return <span className={`${colorClass.text} rounded-full bg-opacity-10 p-0.5`}>✓</span>;
  };

  const currentPlan = pricingPlans.find(plan => plan.tier_enum === user?.premium?.tier?.toLowerCase());

  return (
    <div className="text-white flex flex-col items-center justify-center  w-full p-4">
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
            <ArrowDownCircle className="h-5 w-5 rounded-full bg-purple-400/20 flex items-center justify-center " />
            View Upgrade Options
          </Button>
        </div>

        { currentPlan && (
          <div className={`${getTierColorClass(currentPlan.tier_enum).bgLight}  rounded-xl px-8 pb-8 pt-16 flex flex-col items-center relative overflow-hidden`}>
            <div className=" w-24 h-24 rounded-full  mb-6">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img
                  src={import.meta.env.VITE_API_URL + user!.avatar.url}
                  alt="Profile avatar"
                  width={100}
                  height={100}
                  className="object-cover"
                />
              </div>
            </div>
            <FlickeringGrid
              className="absolute  h-8/12  w-full opacity-50  inset-0 z-0  pointer-events-none"
              squareSize={1.8}
              gridGap={20}
              color="#ffffff"
              maxOpacity={0.12}
              flickerChance={0.1}
            />

            <h1 className="text-3xl font-bold mb-4 text-center">
              You're on the
              {' '}
              {currentPlan.tier}
              {' '}
              Plan
            </h1>

            <p className="text-gray-400 text-center max-w-lg mb-8">
              {currentPlan.description}
              {currentPlan.tier === 'free' && ' As a member of the Trial Plan, you have access to:'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentPlan.benefits.map((benefit, idx) => (
                <div key={idx} className={`${getTierColorClass(currentPlan.tier_enum).text} ${getTierColorClass(currentPlan.tier_enum).glow}  rounded-lg p-4 flex items-center gap-3`}>
                  <CircleCheckBig strokeWidth={2} className="h-6 w-6 " />
                  <span className=" text-sm">{benefit.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 text-center" ref={pricingRef}>
          <h3 className="text-xl font-bold mb-2">Ready to go further?</h3>
          <p className="text-gray-400 mb-8">Upgrade and outship the competition</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {pricingPlans
              .filter(plan => !plan.tier_enum || plan.tier_enum !== user?.premium?.tier?.toLowerCase())
              .map((plan, index) => (
                <div
                  key={index}
                  className={`${getBackgroundColor(plan.tier_enum)} rounded-xl p-6 text-left border ${getTierColorClass(plan.tier_enum).border}`}
                >
                  <div className="flex items-center gap-1">
                    <h3 className={`text-2xl font-bold ${getTierColorClass(plan.tier_enum).text} mb-2`}>{plan.tier}</h3>
                  </div>
                  <p className="text-gray-400 mb-6">{plan.description}</p>

                  <div className="flex items-baseline mb-2">
                    <span className={`${getTierColorClass(plan.tier_enum).text} text-2xl`}>$</span>
                    {plan.price === 0
                      ? (
                          <span className={`${getTierColorClass(plan.tier_enum).text} text-6xl font-bold mx-1`}>0</span>
                        )
                      : (
                          <>
                            <span className={`${getTierColorClass(plan.tier_enum).text} text-6xl font-bold mx-1`}>
                              {plan.price}
                              {Math.floor(plan.price) - 1}
                            </span>
                            <span className={`${getTierColorClass(plan.tier_enum).text} text-4xl font-bold -ml-1`}>.99</span>
                          </>
                        )}
                    <div className="flex relative flex-col ml-1">

                      <span className={`${getTierColorClass(plan.tier_enum).text} text-xl`}>{plan.period}</span>
                    </div>
                  </div>
                  <div className={`border-t ${getTierColorClass(plan.tier_enum).border} my-4`}></div>

                  <ul className="space-y-4">
                    {plan.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {renderIcon(plan.tier_enum)}
                        <span className={benefit.icon === 'gift' ? getTierColorClass(plan.tier_enum).text : 'text-gray-300'}>
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
                      className={`  w-full ${getTierColorClass(plan.tier_enum).bg} ${getTierColorClass(plan.tier_enum).hover} text-white py-3 rounded-md mt-6`}
                    >
                      {plan.buttonText}
                    </Button>
                  </PaymentMethodDialog>

                </div>
              ))}
          </div>

        </div>
      </div>
    </div>
  );
}
