import type React from 'react';
import PremiumPaywall from '@/components/paywall/premium-paywall.tsx';
import { useMembership } from '@/hooks/useMembership.tsx';
import { useEffect, useState } from 'react';

type PremiumContentWrapperProps = {
  children: React.ReactNode;
  isPremiumUser?: boolean;
  onPurchase?: () => void;
};

export default function PremiumContentWrapper({
  children,
  isPremiumUser = false,
  onPurchase,
}: PremiumContentWrapperProps) {
  const [showPaywall, setShowPaywall] = useState(!isPremiumUser);

  // Check user subscription status
  useEffect(() => {
    setShowPaywall(!isPremiumUser);
  }, [isPremiumUser]);

  const { pricingPlans } = useMembership();
  return (
    <div className="relative">
      {children}
      {showPaywall && (
        <PremiumPaywall
          onPurchase={onPurchase}
          features={pricingPlans.find(plan => plan.tier_enum === 'pro')?.benefits.map(item => item.title)}
          title="Unlock Skin Changer"
          description="Get unlimited access to our complete collection of skins, and exclusive features."
          ctaText="Upgrade Now"
        />
      )}
    </div>
  );
}
