// --- START OF FILE PaymentById.tsx ---

import type { Payment, PremiumTiers } from '@/types/types.ts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePaymentsQuery } from '@/features/payment/hooks/usePayments.ts';
import { useCancelPaymentMutation } from '@/features/payment/hooks/usePaymentsCancel.ts';
import { useMembership } from '@/hooks/useMembership.tsx';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Browser } from '@wailsio/runtime';
import { ArrowLeft, BookOpen, CheckCircle, DollarSign, ExternalLink, X } from 'lucide-react';

type PaymentDetailsProps = {
  paymentId: string;
};

const getCurrencySymbol = (currency: string | undefined) => {
  switch (currency?.toUpperCase()) {
    case 'EUR':
      return '€';
    case 'BRL':
      return 'R$';
    case 'USD':
    default:
      return '$';
  }
};

export default function PaymentDetails({ paymentId }: PaymentDetailsProps) {
  const queryClient = useQueryClient();
  const { getPaymentStatusConfig } = useMapping();
  const { getTierColorClass, getGatewayDetails, pricingPlans } = useMembership();

  const { data: allPayments, isLoading, isError, error } = usePaymentsQuery();
  const cancelPaymentMutation = useCancelPaymentMutation();

  const allPaymentsArray: Payment[] = [
    ...(allPayments?.openPayments || []),
    ...(allPayments?.canceledPayments || []),
    ...(allPayments?.paidPayments || []),
  ];

  const payment: Payment | undefined = allPaymentsArray.find(

    p => p.documentId === paymentId,
  );

  const planDetails = payment?.desiredPlan?.name ? pricingPlans.find(plan => plan.tier_enum === payment?.desiredPlan?.name.toLowerCase()) : undefined;

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated skeleton loader
  }

  if (isError) {
    return (
      <div>
        Error loading payment details:
        {error.message}
      </div>
    );
  }
  if (!payment || payment.length === 0) {
    return <div>No payment found.</div>;
  }

  const gateway = getGatewayDetails(payment.gateway);
  const status = getPaymentStatusConfig(payment.paymentStatus);
  const StatusIcon = status.icon;

  const formatPrice = (price: number) => `${getCurrencySymbol(payment.currency)}${(price / 100).toFixed(2)}`;
  function openPaymentLink() {
    console.log('openPaymentLink', payment);
    let url = payment?.metadata.sessionUrl;
    if (payment?.gateway === 'boostRoyal') {
      url = 'https://dashboard.boostroyal.com/profile';
    }
    if (payment?.gateway === 'turboBoost') {
      url = 'https://boosting.turboboost.gg/balance';
    }
    Browser.OpenURL(url);
  }
  const getTutorialForGateway = (gatewayName: string) => {
    switch (gatewayName) {
      case 'stripe':
        return {
          title: 'How to Pay with Stripe',
          steps: [
            {
              step: 1,
              title: 'Redirect to Stripe',
              description: 'You will be redirected to a secure Stripe checkout page to complete your payment.',
            },
            {
              step: 2,
              title: 'Enter Payment Details',
              description: 'On the Stripe page, enter your credit or debit card information, including the card number, expiration date, and CVC.',
            },
            {
              step: 3,
              title: 'Authorize Payment',
              description: 'Review your subscription details and click the "Pay" or "Subscribe" button to confirm the transaction.',
            },
            {
              step: 4,
              title: 'Confirmation and Redirect',
              description: 'Once your payment is successful, you will see a confirmation message and be redirected back to our website.',
            },
          ],
        };
      case 'mercadoPago':
        return {
          title: 'How to Pay with Mercado Pago',
          steps: [
            {
              step: 1,
              title: 'Redirect to Mercado Pago',
              description: 'You will be redirected to the secure Mercado Pago website to finalize your payment.',
            },
            {
              step: 2,
              title: 'Log In or Continue as Guest',
              description: 'You can log in to your Mercado Pago account to use a saved payment method or proceed as a guest.',
            },
            {
              step: 3,
              title: 'Select Payment Method',
              description: 'Choose your preferred payment option, such as a credit card, debit card, or your Mercado Pago account balance.',
            },
            {
              step: 4,
              title: 'Complete the Transaction',
              description: 'Follow the on-screen instructions to authorize and complete the payment. You will then be redirected back to our site.',
            },
          ],
        };
      case 'boostRoyal':
        return {
          title: 'How to Pay with Boost Royal',
          steps: [
            {
              step: 1,
              title: 'Navigate to Balance Page',
              description: 'Go to the Boost Royal page by clicking on go to Subscription',
            },
            {
              step: 2,
              title: 'Initiate Transfer',
              description: 'Send the total price for your desired plan via the Boost Royal "transfer balance" feature.',
            },
            {
              step: 3,
              title: 'Use Transfer Token',
              description: 'Use the specific transfer token for the transaction: nexus-assign-42.',
            },
            {
              step: 4,
              title: 'Confirmation',
              description: 'Your payment will be processed automatically, and your account will be upgraded immediately once the transfer is confirmed.',
            },
          ],
        };
      case 'turboBoost':
        return {
          title: 'How to Pay with TurboBoost',
          steps: [
            {
              step: 1,
              title: 'Navigate to Balance Page',
              description: 'Go to the Turbo balance page by clicking on go to Subscription',
            },
            {
              step: 2,
              title: 'Select Package',
              description: 'At the bottom left, under your balance display, click the button for the package you wish to purchase.',
            },
            {
              step: 3,
              title: 'Complete Purchase',
              description: 'The funds will be transferred automatically to complete the payment.',
            },
          ],
        };
      case 'nowPayments':
        return {
          title: 'How to Pay with NowPayments (Crypto)',
          steps: [
            {
              step: 1,
              title: 'Select Cryptocurrency',
              description: 'After being redirected to NowPayments, select the cryptocurrency you wish to use for payment.',
            },
            {
              step: 2,
              title: 'Get Payment Details',
              description: 'A unique wallet address and the exact payment amount will be displayed. You can copy the address or scan the QR code.',
            },
            {
              step: 3,
              title: 'Send Funds from Your Wallet',
              description: 'From your personal crypto wallet, send the exact amount to the provided address. Ensure you also cover any network transaction fees.',
            },
            {
              step: 4,
              title: 'Await Blockchain Confirmation',
              description: 'Your payment will be processed once the transaction is confirmed on the blockchain. Your account will then be upgraded automatically.',
            },
          ],
        };
      default:
        return {
          title: 'How to Make a Payment',
          steps: [
            {
              step: 1,
              title: 'Choose Your Desired Plan',
              description: 'Select the subscription plan that best fits your gaming needs and budget from our available options.',
            },
            {
              step: 2,
              title: 'Select Payment Method',
              description: 'Choose from Stripe, Mercado Pago, Boost Royal, or other available secure payment gateways.',
            },
            {
              step: 3,
              title: 'Apply Discount Code (Optional)',
              description: 'Enter any valid discount codes to reduce your total payment amount before checkout.',
            },
            {
              step: 4,
              title: 'Complete Secure Payment',
              description: 'Follow the secure checkout process and your payment will be processed automatically.',
            },
            {
              step: 5,
              title: 'Instant Access',
              description: 'Your account will be upgraded immediately once payment is confirmed and processed.',
            },
          ],
        };
    }
  };
  const tutorial = getTutorialForGateway(payment.gateway);

  const tierEnum = payment.desiredPlan.name.toLowerCase() as PremiumTiers;
  const tierColors = getTierColorClass(tierEnum);

  async function handleCancelPayment() {
    await cancelPaymentMutation.mutate(payment!.documentId);
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['payments', 'user'], exact: false }), 1000);
  }
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link to="/payments">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              Back to Payment History
            </Button>
          </Link>

          {payment.paymentStatus === 'open' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 bg-transparent"
              disabled={cancelPaymentMutation.isPending}
              onClick={handleCancelPayment}
            >
              <X className="w-4 h-4" />
              {cancelPaymentMutation.isPending ? 'Canceling...' : 'Cancel Payment'}
            </Button>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Details</h1>
          <p className="text-gray-400">
            Transaction ID:
            {paymentId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Content - Takes up more space */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-zinc-900/50 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-gray-700/50 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{tutorial.title}</h2>
                  <p className="text-sm text-gray-400">Follow these simple steps</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {tutorial.steps.map(step => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold shadow-lg">
                      {step.step}
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-white mb-1">{step.title}</p>
                      <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-4">
                <p className="text-sm font-medium text-purple-300 text-center">
                  Your payment will be processed automatically and your account upgraded immediately once confirmed
                </p>
              </div>
            </div>
          </div>

          <div
            className={cn('rounded-2xl p-8 border relative overflow-hidden shadow-xl', tierColors?.bgLight, tierColors?.border)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={cn('text-2xl font-bold', tierColors?.text)}>{payment.desiredPlan.name}</h3>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed max-w-md">{planDetails?.description}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline mb-1">
                    <span className={cn('text-2xl font-bold', tierColors?.text)}>{getCurrencySymbol(payment.currency)}</span>
                    <span className={cn('text-4xl font-bold mx-1', tierColors?.text)}>
                      {(payment.desiredPlan.monthlyPrice / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">/month</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {payment.desiredMonths}
                    {' '}
                    months selected
                  </p>
                </div>
              </div>

              <div className={cn('border-t my-6 opacity-30', tierColors?.border)}></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {planDetails?.benefits.map((benefit, idx) => (
                  <div
                    key={`benefit-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <CheckCircle className={cn('h-4 w-4', tierColors?.text)} />
                    <span className="text-sm font-medium text-white">{benefit.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 rounded-2xl border border-gray-700/50 overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-gray-700/50 p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/20">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Payment Summary</h3>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {gateway.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{gateway.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs font-medium capitalize', status.bg, status.color)}>

                    <StatusIcon className={cn('w-4 h-4', status.color)} />
                    {status.label}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-gray-700/50" />

              <div className="space-y-3">
                {/* <div className="flex justify-between text-sm"> */}
                {/*  <p className="text-gray-400"> */}
                {/*    {payment.desiredPlan.name} */}
                {/*    {' '} */}
                {/*    × */}
                {/*    {payment.desiredMonths} */}
                {/*    {' '} */}
                {/*    month */}
                {/*    {payment.desiredMonths > 1 ? 's' : ''} */}
                {/*  </p> */}
                {/*  <p className="text-white font-medium"> */}
                {/*    {formatPrice(payment.desiredPlan.monthlyPrice * payment.desiredMonths)} */}
                {/*  </p> */}
                {/* </div> */}

                {payment.discounts && payment.discounts.map((discount, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <p className="text-green-400 capitalize">
                      {discount.type.replace(/([A-Z])/g, ' $1').trim()}
                      {' '}
                      Discount
                    </p>
                    <p className="text-green-400 font-medium">
                      -
                      {discount.isPercentage
                        ? `${discount.value}%`
                        : formatPrice(discount.value)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="bg-gray-700/50" />
              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <p className="text-white font-bold text-lg">Total</p>
                <p className="text-white font-bold text-xl">{formatPrice(payment.price)}</p>
              </div>

              <div className="pt-4">
                <Button disabled={payment.paymentStatus === 'canceled'} onClick={openPaymentLink} className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 rounded-xl shadow-lg">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to Subscription
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
