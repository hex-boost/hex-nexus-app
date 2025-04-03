
import type { CheckoutSession, PricingPlan, SubscriptionRequest } from '@/types/membership.ts';
import { Badge } from '@/components/ui/badge';
import { Pricing } from '@/components/ui/pricing-cards.tsx';
import { strapiClient } from '@/lib/strapi.ts';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Browser } from '@wailsio/runtime';
import { MoveRight } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_protected/subscription/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [currentApiTier] = useState<string | undefined>('tier 2');
  const [pendingPlanTier, setPendingPlanTier] = useState<string | null>(null);

  
  const mapTierToDisplayName = (tier: string | undefined): string => {
    switch (tier) {
      case 'tier 1': return 'Professional';
      case 'tier 2': return 'Premium';
      case 'tier 3': return 'Basic';
      default: return 'Free Trial';
    }
  };

  
  const mapDisplayNameToApiTier = (displayName: string): string => {
    switch (displayName) {
      case 'Professional': return 'tier 1';
      case 'Premium': return 'tier 2';
      case 'Basic': return 'tier 3';
      default: return 'free';
    }
  };

  const currentPlanTier = mapTierToDisplayName(currentApiTier);
  const pricingPlans: PricingPlan[] = [
    {
      tier: 'Free Trial',
      description: 'Try our service to see if it fits your boosting needs.',
      price: 0,
      period: 'month',
      benefits: [
        {
          title: 'Accounts up to Platinum',
          description: '',
        },
        {
          title: 'Wins 300 coins bonus',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Free Trial' ? 'Current Plan' : 'Get started for free',
      buttonVariant: 'outline',
      buttonIcon: <MoveRight className="w-4 h-4" />,
      highlighted: currentPlanTier === 'Free Trial',
    },
    {
      tier: 'Basic',
      description: 'Perfect for part-time boosters',
      price: 10,
      productID: 'prod_S1fq7S9IZvkbpZ',
      priceID: 'price_1R7cVHH5geFvBgszgYr9Jcbw',
      benefits: [
        {
          title: 'Instantly earns 3000 coins',
          description: '',
        },
        {
          title: 'Accounts up to Emerald',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Basic' ? 'Current Plan' : 'Choose Basic',
      buttonVariant: 'outline',
      buttonIcon: <MoveRight className="w-4 h-4" />,
      highlighted: currentPlanTier === 'Basic',
    },
    {
      tier: 'Premium',
      description: 'The ideal solution for serious boosters who accounts.',
      price: 20,
      productID: 'prod_S1fqyKNDvKHwaf',
      priceID: 'price_1R7cUzH5geFvBgszpO8iF39D',
      benefits: [
        {
          title: 'Instantly earns 10000 coins',
          description: '',
        },
        {
          title: 'Accounts up to Diamond',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Premium' ? 'Current Plan' : 'Choose Premium',
      highlighted: currentPlanTier === 'Premium',
    },
    {
      tier: 'Professional',
      description: 'For full-time professional boosters',
      price: 30,
      productID: 'prod_RvrOOPilyjlFDb',
      priceID: 'price_1R1zfKH5geFvBgszzAPRt8o8',
      benefits: [
        {
          title: 'Unlimited coins & accounts',
          description: '',
        },
        {
          title: 'All ranks available',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Professional' ? 'Current Plan' : 'Choose Professional',
      buttonVariant: 'outline',
      highlighted: currentPlanTier === 'Professional',
    },
  ];

  async function createSubscription(data: SubscriptionRequest): Promise<CheckoutSession> {
    try {
      const response = await strapiClient.create<CheckoutSession>(
        'stripe/subscription',
        data,
      );

      return response.data;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new Error('Failed to create subscription');
    }
  }
  const { mutate: selectPlan } = useMutation({
    mutationKey: ['subscription'],
    mutationFn: async (tier: string) => {
      setPendingPlanTier(tier);

      
      const selectedPlan = pricingPlans.find(plan => plan.tier === tier);

      if (!selectedPlan?.priceID || !selectedPlan?.productID) {
        throw new Error('Invalid plan selected or free plan');
      }

      
      return await createSubscription({
        priceID: selectedPlan.priceID,
        productID: selectedPlan.productID,
        subscriptionTier: mapDisplayNameToApiTier(tier),
      });
    },
    onSuccess: async (data) => {
      await Browser.OpenURL(data.url!);
      setPendingPlanTier(null);
    },
    onError: (error) => {
      console.error('Subscription error:', error);
      setPendingPlanTier(null);
    },
  });

  return (
    <div>
      <div className="w-full">
        <div className="">
          <div className="flex text-center justify-center items-center gap-4 flex-col">
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl tracking-tighter max-w-xl text-center font-semibold">
                Choose Your Boosting Experience
              </h2>
              <p className="leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
                Access premium LoL accounts for your boosting services with flexible plans
              </p>
              <p className="text-center">
                <Badge variant="outline" className="text-primary">
                  Current Plan:
                  {' '}
                  {currentPlanTier}
                </Badge>
              </p>
            </div>
            <Pricing
              pendingPlanTier={pendingPlanTier}
              onPlanSelect={selectPlan}
              plans={pricingPlans}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
