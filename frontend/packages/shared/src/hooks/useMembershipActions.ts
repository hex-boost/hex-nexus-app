import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import type { Payment, PremiumTiers } from '@/types/types.ts';

import { useMembership } from '@/hooks/useMembership.tsx';
import { strapiClient } from '@/lib/strapi.ts';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

// Define types for the new payment creation functionality
type SubscriptionPaymentPayload = {
  gateway: PaymentMethodsAccepted;
  desiredPlan: PremiumTiers;
  desiredMonths: number;
  currency: Currency;
  discountCodeString?: string;

};
type PaymentResponse = {
  message: string;
  payment: Payment;
};
export function useMembershipActions() {
  const { paymentMethods } = useMembership();
  const navigate = useNavigate();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethodsAccepted>(paymentMethods[0].title);
  const [pendingPlanTier, setPendingPlanTier] = useState<string | null>(null);

  // const { mutate: selectPlan } = useMutation({
  //   mutationKey: ['subscription'],
  //   mutationFn: async (tier: string) => {
  //     if (user?.premium?.plan?.tier !== 1) {
  //       throw new Error('You already have a plan, please contact support if you want to change or extend it');
  //     }
  //     setPendingPlanTier(tier);
  //
  //     // 1. First get callback URLs from local Go server
  //     const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();
  //
  //     return await createStripeSubscription({
  //       subscriptionTier: tier, // Directly pass tier (no mapping needed)
  //       successUrl,
  //       cancelUrl,
  //     });
  //   },
  //   onSuccess: async (data) => {
  //     await Browser.OpenURL(data.url as string);
  //     setPendingPlanTier(null);
  //   },
  //   onError: (error) => {
  //     if (error.message) {
  //       toast.warning(error.message);
  //     }
  //     console.error('Subscription error:', error);
  //     setPendingPlanTier(null);
  //   },
  //
  // });

  // const { isPending, mutate: handlePayment } = useMutation({
  //   mutationKey: ['payment', selectedPaymentMethod],
  //   mutationFn: async (selectedTier: PremiumTiers) => {
  //     if (user?.premium?.plan?.tier !== 1) {
  //       throw new Error('You already have a plan, please contact support if you want to change or extend it');
  //     }
  //     let url: string = '';
  //     if (selectedPaymentMethod === 'Pix') {
  //       const pixResponse = await createPixPayment({ membershipEnum: selectedTier });
  //       url = pixResponse.data.point_of_interaction?.transaction_data?.ticket_url as string;
  //     }
  //     if (selectedPaymentMethod === 'Stripe') {
  //       const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();
  //       const stripeResponse = await createStripeSubscription({ subscriptionTier: selectedTier.toLowerCase(), cancelUrl, successUrl });
  //       url = stripeResponse.url;
  //     }
  //     await Browser.OpenURL(url);
  //   },
  //   onError: (error) => {
  //     if (error.message) {
  //       toast.warning(error.message);
  //     }
  //   },
  // });

  const { mutate: createSubscriptionPayment, isPending: isCreatingPayment } = useMutation({
    mutationKey: ['createSubscriptionPayment'],
    mutationFn: (payload: SubscriptionPaymentPayload) => {
      return strapiClient.request<PaymentResponse>('post', '/payments/subscription', {
        data: payload,
      });
    },
    onSuccess: (data) => {
      let countdown = 3;
      const toastId = toast.success(
        `Payment created successfully! Redirecting in ${countdown}...`,
      );

      const intervalId = setInterval(() => {
        countdown -= 1;
        if (countdown > 0) {
          toast.success(
            `Payment created successfully! Redirecting in ${countdown}...`,
            { id: toastId },
          );
        } else {
          clearInterval(intervalId);
          toast.dismiss(toastId);
          navigate({ to: `/payments/${data.payment.documentId}` });
        }
      }, 1000);
    },
    onError: (error: any) => {
      const specificMessage = error?.data.error?.message;

      if (specificMessage) {
        toast.error(specificMessage, {
          action: {
            label: 'View Payments',
            onClick: () => navigate({ to: '/payments' }),
          },
        });
      } else {
        // Fallback for other types of errors
        toast.error(error.message || 'Failed to create payment.');
      }
      console.error('Payment creation error:', error);
    },
  });

  return {
    pendingPlanTier,
    setPendingPlanTier,
    setSelectedPaymentMethod,
    paymentMethods,
    createSubscriptionPayment, // Expose the new mutation
    isCreatingPayment, // Expose the pending state for the new mutation

    selectedPaymentMethod,
  };
}
