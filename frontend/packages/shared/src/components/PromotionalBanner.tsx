import type { PremiumTiers } from '@/types/types.ts';
import { useMembership } from '@/hooks/useMembership.ts';
import { AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

type PromotionalBannerProps = {
  userTier: PremiumTiers;
  endDate: string; // ISO date string for when the promotion ends
};

export function PromotionalBanner({ userTier, endDate }: PromotionalBannerProps) {
  const { getTierColorClass } = useMembership();
  const colorClass = getTierColorClass(userTier);

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className={`${colorClass.bgLight} rounded-xl p-6 my-8 relative overflow-hidden`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`${colorClass.bg} p-3 rounded-full`}>
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Your Pro Membership Will Expire Soon!</h3>
            <p className="text-gray-300">Lock in 50% OFF pricing by extending your membership now</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${colorClass.text}`} />
            <span className="text-gray-300">Offer ends in:</span>
          </div>

          <div className="flex gap-2">
            <div className={`${colorClass.bg} px-3 py-2 rounded-md text-white`}>
              <span className="text-xl font-bold">{timeLeft.days}</span>
              <span className="text-xs block">days</span>
            </div>
            <div className={`${colorClass.bg} px-3 py-2 rounded-md text-white`}>
              <span className="text-xl font-bold">{timeLeft.hours}</span>
              <span className="text-xs block">hours</span>
            </div>
            <div className={`${colorClass.bg} px-3 py-2 rounded-md text-white`}>
              <span className="text-xl font-bold">{timeLeft.minutes}</span>
              <span className="text-xs block">mins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
