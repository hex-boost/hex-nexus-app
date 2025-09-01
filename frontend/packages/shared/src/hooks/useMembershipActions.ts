import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { Payment, PremiumTiers } from '@/types/types.ts';
import { useMembership } from '@/hooks/useMembership.tsx';
import { strapiClient } from '@/lib/strapi.ts';

import { PaymentMethodEnum } from '@/types/membership';
import { Stripe } from '@stripe';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Browser } from '@wailsio/runtime';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

// Define types for the new payment creation functionality

type SubscriptionPaymentPayload = {
  gateway: PaymentMethodEnum;
  desiredPlan: PremiumTiers;
  desiredMonths: number;
  desiredCurrency: Currency;
  discountCodeString?: string;
  successUrl?: string;
  cancelUrl?: string;

};
type PaymentResponse = {
  message: string;
  response: { discounts: any; payment: Payment; url: string };
};
export function useMembershipActions() {
  const { paymentMethods } = useMembership();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethodEnum>(paymentMethods[0].method);
  const [pendingPlanTier, setPendingPlanTier] = useState<string | null>(null);

  const { mutate: createSubscriptionPayment, isPending: isCreatingPayment } = useMutation({
    mutationKey: ['user', 'payments', 'create'],
    mutationFn: async (payload: SubscriptionPaymentPayload) => {
      const finalPayload = { ...payload };

      if (finalPayload.gateway === PaymentMethodEnum.BoostRoyal) {
        finalPayload.successUrl = 'https://dashboard.boostroyal.com/profile';
        finalPayload.cancelUrl = 'https://dashboard.boostroyal.com/profile';
      }
      if (finalPayload.gateway === PaymentMethodEnum.TurboBoost) {
        finalPayload.successUrl = 'https://boosting.turboboost.gg/balance';
        finalPayload.cancelUrl = 'https://boosting.turboboost.gg/balance';
      }
      if (payload.gateway === PaymentMethodEnum.NowPayments || payload.gateway === PaymentMethodEnum.Stripe) {
        const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();
        finalPayload.successUrl = successUrl;
        finalPayload.cancelUrl = cancelUrl;
      }

      return strapiClient.request<PaymentResponse>('post', '/payments/subscription', {
        data: finalPayload,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'user'] });
      let countdown = 3;
      const toastId = toast.success(
        `Payment created successfully! Redirecting in ${countdown}...`,
      );
      console.log('Payment creation response:', data);
      Browser.OpenURL(data.response.url);
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

          navigate({ to: `/payments/${data.response.payment.documentId}` });
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
