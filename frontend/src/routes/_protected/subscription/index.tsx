import type { CheckoutSession, PricingPlan, SubscriptionRequest } from '@/types/membership.ts';
import { Pricing } from '@/components/ui/pricing-cards.tsx';
import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { Stripe } from '@stripe';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Browser } from '@wailsio/runtime';
import { MoveRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/subscription/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [pendingPlanTier, setPendingPlanTier] = useState<string | null>(null);
  const { user } = useUserStore();
  const userPremiumTier = user?.premium?.tier?.toLowerCase();
  const pricingPlans: PricingPlan[] = [
    {
      tier: 'free',
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
      buttonText: userPremiumTier === 'free' ? 'Current Plan' : 'Get started for free',
      buttonVariant: 'outline',
      buttonIcon: <MoveRight className="w-4 h-4" />,
      highlighted: userPremiumTier === 'free', // Corrected condition
    },
    {
      tier: 'basic',
      description: 'Perfect for part-time boosters',
      price: 10,
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
      buttonText: userPremiumTier === 'basic' ? 'Current Plan' : 'Choose Basic',
      buttonVariant: 'outline',
      buttonIcon: <MoveRight className="w-4 h-4" />,
      highlighted: userPremiumTier === 'basic',
    },
    {
      tier: 'premium',
      description: 'The ideal solution for serious boosters who need more accounts.',
      price: 20,
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
      buttonText: userPremiumTier === 'premium' ? 'Current Plan' : 'Choose Premium',
      highlighted: userPremiumTier === 'premium',
    },
    {
      tier: 'pro',
      description: 'For full-time professional boosters',
      price: 30,
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
      buttonText: userPremiumTier === 'pro' ? 'Current Plan' : 'Choose Professional',
      buttonVariant: 'outline',
      highlighted: userPremiumTier === 'pro',
    },
  ];
  async function createSubscription(data: SubscriptionRequest): Promise<CheckoutSession> {
    try {
      return await strapiClient.request<CheckoutSession>('post', 'stripe/subscription', {
        data,
      });
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new Error('Failed to create subscription');
    }
  }
  const { mutate: selectPlan } = useMutation({
    mutationKey: ['subscription'],
    mutationFn: async (tier: string) => {
      if (user?.premium?.tier) {
        throw new Error('You already have a plan');
      }
      setPendingPlanTier(tier);

      // 1. First get callback URLs from local Go server
      const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();

      // 2. Then pass these URLs to Strapi for subscription creation
      return await createSubscription({
        subscriptionTier: tier, // Directly pass tier (no mapping needed)
        successUrl,
        cancelUrl,
      });
    },
    onSuccess: async (data) => {
      await Browser.OpenURL(data.url as string);
      setPendingPlanTier(null);
    },
    onError: (error) => {
      if (error.message) {
        toast.warning(error.message);
      }
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
