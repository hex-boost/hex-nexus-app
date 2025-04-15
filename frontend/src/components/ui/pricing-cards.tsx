'use client';

import type { PricingPlan } from '@/types/membership.ts';
import { FlickeringGrid } from '@/components/magicui/flickering-grid.tsx';
import { PaymentMethodDialog } from '@/components/PaymentMethodDialog.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/useUserStore.ts';
import { CircleCheckBig } from 'lucide-react';
import { useRef } from 'react';

export default function PricingCards({ pricingPlans }: { pricingPlans: PricingPlan[] }) {
  const pricingRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getColorClass = (color: string, element: 'bg' | 'text' | 'border' | 'hover') => {
    const colorMap: Record<string, Record<string, string>> = {
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-300',
        border: 'border-[#1a2e45]',
        hover: 'hover:bg-blue-600',
      },
      primary: {
        bg: 'bg-primary',
        text: 'text-indigo-300',
        border: 'border-[#384394]',
        hover: 'hover:bg-indigo-700',
      },

      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-300',
        border: 'border-[#2d1a45]',
        hover: 'hover:bg-purple-700',
      },
      emerald: {
        bg: 'bg-emerald-600',
        text: 'text-emerald-300',
        border: 'border-emerald-900/30',
        hover: 'hover:bg-emerald-700',
      },
    };

    return colorMap[color]?.[element] || '';
  };

  const getBackgroundColor = (color: string) => {
    const bgMap: Record<string, string> = {
      blue: 'bg-[#0a1525]',
      purple: 'bg-[#1a0a29]',
      emerald: 'bg-gradient-to-b from-[#1a2e29] to-[#0f1e1b]',
      primary: 'bg-[#151937]',
    };

    return bgMap[color] || '';
  };

  const renderIcon = (icon: string | undefined, color: string) => {
    const colorClass = getColorClass(color, 'text');

    switch (icon) {
      case 'check':
        return <span className={`${colorClass} rounded-full bg-opacity-10 p-0.5`}>✓</span>;
      case 'gift':
        return <span className={colorClass}>🎁</span>;
      default:
        return null;
    }
  };

  const currentPlan = pricingPlans.find(plan => plan.isCurrentPlan);

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
            <span className="h-5 w-5 rounded-full bg-purple-400/20 flex items-center justify-center text-purple-400">
              ↗
            </span>
            View Upgrade Options
          </Button>
        </div>

        {currentPlan && (
          <div className={`${getBackgroundColor(currentPlan.color)}  rounded-xl px-8 pb-8 pt-16 flex flex-col items-center relative overflow-hidden`}>
            <div className="w-24 h-24 rounded-full bg-[#2a9d8f] p-1 mb-6">
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
                <div key={idx} className="bg-[#1a2e29]/50 text- rounded-lg p-4 flex items-center gap-3">
                  <CircleCheckBig strokeWidth={2} className="h-6 w-6 text-green-300" />
                  <span className="text-green-300 text-sm">{benefit.title}</span>
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
              .filter(plan => !plan.isCurrentPlan)
              .map((plan, index) => (
                <div
                  key={index}
                  className={`${getBackgroundColor(plan.color)} rounded-xl p-6 text-left border ${getColorClass(plan.color, 'border')}`}
                >
                  <div className="flex items-center gap-1">
                    <h3 className={`text-2xl font-bold ${getColorClass(plan.color, 'text')} mb-2`}>{plan.tier}</h3>
                  </div>
                  <p className="text-gray-400 mb-6">{plan.description}</p>

                  <div className="flex items-baseline mb-2">
                    <span className={`${getColorClass(plan.color, 'text')} text-2xl`}>$</span>
                    <span className={`${getColorClass(plan.color, 'text')} text-6xl font-bold mx-1`}>{plan.price}</span>
                    <span className={`${getColorClass(plan.color, 'text')} text-xl`}>{plan.period}</span>
                  </div>

                  <div className={`border-t ${getColorClass(plan.color, 'border')} my-4`}></div>

                  <ul className="space-y-4">
                    {plan.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {renderIcon(benefit.icon, plan.color)}
                        <span className={benefit.icon === 'gift' ? getColorClass(plan.color, 'text') : 'text-gray-300'}>
                          {benefit.title}
                        </span>
                        {benefit.isNew && (
                          <Badge
                            className={`${getColorClass(plan.color, 'bg')} text-white text-xs px-1.5 py-0.5 rounded`}
                          >
                            New!
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>

                  <PaymentMethodDialog selectedTier={plan.tier}>
                    <Button
                      className={`  w-full ${getColorClass(plan.color, 'bg')} ${getColorClass(plan.color, 'hover')} text-white py-3 rounded-md mt-6`}
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
