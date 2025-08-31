import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import type { PricingPlan } from '@/types/types.ts';
import { Button } from '@/components/ui/button.tsx';
import { useMembership } from '@/hooks/useMembership.tsx';
import { ArrowLeft } from 'lucide-react';
import { PaymentInstructions } from './PaymentInstructions.tsx';
import { PaymentLink } from './PaymentLink.tsx';

type WaitingForPaymentPageProps = {
  selectedPlan: PricingPlan;
  selectedPaymentMethod: PaymentMethodsAccepted;
  paymentDetails: {
    documentId: string;
  };
  onBack: () => void;
};

export function WaitingForPaymentPage({
  selectedPlan,
  selectedPaymentMethod,
  paymentDetails,
  onBack,
}: WaitingForPaymentPageProps) {
  const { getTierColorClass } = useMembership();
  const tierColor = getTierColorClass(selectedPlan.tier_enum);

  const needsSpecialInstructions = ['Boost Royal', 'Turbo'].includes(selectedPaymentMethod);

  return (
    <div className="container mx-auto p-4 text-white">
      <div className="relative flex items-center justify-center mb-16">
        <Button
          variant="ghost"
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        {needsSpecialInstructions
          ? (
              <div className="bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
                <PaymentInstructions paymentMethod={selectedPaymentMethod as 'Boost Royal' | 'Turbo'} />
              </div>
            )
          : (
              <div className="bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-[#1F1F23] p-6 flex flex-col gap-6">
                <h3 className="text-2xl font-bold text-center">Complete Your Payment</h3>
                <p className="text-center text-gray-400">Your order has been created. Click the button below to go to the payment page.</p>
                <div className={`rounded-lg border p-4 ${tierColor.border} bg-black/20 flex justify-between items-center`}>
                  <div>
                    <h4 className={`font-bold text-lg ${tierColor.text}`}>
                      {selectedPlan.tier}
                      {' '}
                      Plan
                    </h4>
                    <p className="text-sm text-gray-300">This plan is valid for the period you selected.</p>
                  </div>
                  <div className={`text-2xl font-bold ${tierColor.text}`}>
                    {selectedPlan.price !== undefined ? `$${(selectedPlan.price / 100).toFixed(2)}` : 'N/A'}
                  </div>
                </div>
                <PaymentLink paymentId={paymentDetails.documentId} />
              </div>
            )}
      </div>
    </div>
  );
}
