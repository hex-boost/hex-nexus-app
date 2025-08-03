import type { CheckoutSession, PaymentMethodsAccepted, SubscriptionRequest } from '@/types/membership.ts';
import type { PremiumTiers } from '@/types/types.ts';
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';

import { useMembership } from '@/hooks/useMembership.ts';

import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { Stripe } from '@stripe';
import { useMutation } from '@tanstack/react-query';
import { useFlag } from '@unleash/proxy-client-react';
import { Browser } from '@wailsio/runtime';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

export function useMembershipActions() {
  const mercadoPagoEnabled = useFlag('mercadoPagoEnabled');
  const isStripeEnabled = useFlag('stripeEnabled');
  const { paymentMethods } = useMembership();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethodsAccepted>(paymentMethods[0].title);
  const [pendingPlanTier, setPendingPlanTier] = useState<string | null>(null);
  async function createStripeSubscription(data: SubscriptionRequest): Promise<CheckoutSession> {
    if (!isStripeEnabled) {
      throw new Error('Mercado Pago is temporary disabled');
    }
    try {
      return await strapiClient.request<CheckoutSession>('post', 'stripe/subscription', {
        data,
      });
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new Error('Failed to create subscription');
    }
  }
  type PixPayload = {
    membershipEnum: PremiumTiers;
  };
  type PixResponse = {
    message: string;
    data: PaymentResponse;
  };
  async function createPixPayment(payload: PixPayload): Promise<PixResponse> {
    if (!mercadoPagoEnabled) {
      throw new Error('Mercado Pago is temporary disabled');
    }
    try {
      return await strapiClient.request<PixResponse>('post', 'mercadopago/subscription', {
        data: { ...payload },

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
      if (user?.premium?.plan?.tier !== 1) {
        throw new Error('You already have a plan, please contact support if you want to change or extend it');
      }
      setPendingPlanTier(tier);

      // 1. First get callback URLs from local Go server
      const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();

      return await createStripeSubscription({
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

  const { isPending, mutate: handlePayment } = useMutation({
    mutationKey: ['payment', selectedPaymentMethod],
    mutationFn: async (selectedTier: PremiumTiers) => {
      if (user?.premium?.plan?.tier !== 1) {
        throw new Error('You already have a plan, please contact support if you want to change or extend it');
      }
      let url: string = '';
      if (selectedPaymentMethod === 'Pix') {
        const pixResponse = await createPixPayment({ membershipEnum: selectedTier });
        url = pixResponse.data.point_of_interaction?.transaction_data?.ticket_url as string;
      }
      if (selectedPaymentMethod === 'Stripe') {
        const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();
        const stripeResponse = await createStripeSubscription({ subscriptionTier: selectedTier.toLowerCase(), cancelUrl, successUrl });
        url = stripeResponse.url;
      }
      await Browser.OpenURL(url);
    },
    onError: (error) => {
      if (error.message) {
        toast.warning(error.message);
      }
    },
  });
  return {
    createStripeSubscription,
    createPixPayment,
    selectPlan,
    pendingPlanTier,
    setPendingPlanTier,
    setSelectedPaymentMethod,
    paymentMethods,
    handlePayment,
    isPending,

    selectedPaymentMethod,
  };
}
