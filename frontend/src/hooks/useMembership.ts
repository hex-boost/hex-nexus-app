import type { CheckoutSession, SubscriptionRequest } from '@/types/membership.ts';
import { strapiClient } from '@/lib/strapi.ts';

import { useUserStore } from '@/stores/useUserStore.ts';
import { Stripe } from '@stripe';
import { useMutation } from '@tanstack/react-query';
import { Browser } from '@wailsio/runtime';
import { useState } from 'react';
import { toast } from 'sonner';

export function useMembership() {
  const [pendingPlanTier, setPendingPlanTier] = useState<string | null>(null);
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
  const { user } = useUserStore();
  const { mutate: selectPlan } = useMutation({
    mutationKey: ['subscription'],
    mutationFn: async (tier: string) => {
      if (user?.premium?.tier) {
        throw new Error('You already have a plan');
      }
      setPendingPlanTier(tier);

      // 1. First get callback URLs from local Go server
      const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();

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
  return {
    selectPlan,
    pendingPlanTier,
    setPendingPlanTier,
  };
}
