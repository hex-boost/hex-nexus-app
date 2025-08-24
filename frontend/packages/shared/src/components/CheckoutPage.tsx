import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import type { PricingPlan } from '@/types/types.ts';
import { PricingCard } from '@/components/checkout/PricingCard.tsx';
import { WaitingForPaymentPage } from '@/components/checkout/WaitingForPaymentPage.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { useMembership } from '@/hooks/useMembership.ts';
import { useMembershipActions } from '@/hooks/useMembershipActions.ts';
import { useMembershipPrices } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { ArrowLeft, Minus, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import { cls } from 'react-image-crop';
import { toast } from 'sonner';

// Define a type for the payment response object
type PaymentResponse = {
  documentId: string;
  // Add other properties from the payment object as needed
};

export function CheckoutPage({ selectedPlan, onBack }: { selectedPlan: PricingPlan; onBack: () => void }) {
  const {
    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isPending,
    createSubscriptionPayment,
  } = useMembershipActions();

  const { getTierColorClass, getBackgroundColor } = useMembership();
  const { getCompanyIconNode } = useMapping();
  const { selectedCurrency } = useMembershipPrices();

  const [months, setMonths] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentResponse | null>(null); // State to hold payment info

  const handleMonthChange = (amount: number) => {
    setMonths(prev => Math.max(1, prev + amount));
  };

  const handleCreatePayment = async () => {
    try {
      // const response = await createSubscriptionPayment({
      //   gateway: selectedPaymentMethod,
      //   desiredPlan: selectedPlan.tier_enum,
      //   desiredMonths: months,
      //   discountCodeString: discountCode,
      // });
      toast.success('Payment flow initiated.');
      setPaymentDetails({ documentId: '#Dsad' }); // Set payment details to switch view
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment.');
    }
  };

  const tierPricePerMonth = selectedPlan.price ? selectedPlan.price / 100 : 15; // Make price dynamic from plan
  const totalPrice = tierPricePerMonth * months;
  const selectedTier = selectedPlan.tier_enum;

  // If payment has been created, show the "Waiting for Payment" page
  if (paymentDetails) {
    return (
      <WaitingForPaymentPage
        selectedPlan={selectedPlan}
        selectedPaymentMethod={selectedPaymentMethod}
        paymentDetails={paymentDetails}
        onBack={onBack}
      />
    );
  }

  // Otherwise, show the checkout form
  return (
    <div className="container mx-auto p-4 text-white">
      <div className="relative mb-8 text-center">
        <Button
          variant="ghost"
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>
        <h1 className="text-3xl font-bold">Complete your Payment</h1>
        <p className="text-gray-400 mt-2">Select the best payment method and months.</p>
      </div>

      <div className="flex gap-8">
        {/* Left side: Selected Plan Card */}
        <div className="lg:col-span-1">
          <PricingCard
            className="min-w-sm"
            plan={selectedPlan}
            selectedCurrency={selectedCurrency}
            onCheckout={() => {}}
            isLoading={false}
            isSelected={true}
          />
        </div>

        {/* Middle: Payment Method & Details */}
        <div className="flex w-full flex-col gap-8">
          <div className="bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-[#1F1F23] p-6 h-full">
            <h3 className="text-xl font-bold mb-4">Choose a payment method</h3>
            <RadioGroup
              value={selectedPaymentMethod}
              onValueChange={(value: PaymentMethodsAccepted) => setSelectedPaymentMethod(value)}
            >
              {paymentMethods.map(method => (
                <div
                  key={method.title}
                  className={cls(`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 hover:bg-white/5 transition-all ${
                    selectedPaymentMethod === method.title ? 'bg-white/10 border-purple-400' : 'dark:border-[#1F1F23]'
                  }`)}
                  onClick={() => setSelectedPaymentMethod(method.title)}
                  role="radio"
                  aria-checked={selectedPaymentMethod === method.title}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {/* Render SVG string, PNG, or fallback */}
                      {typeof method.icon === 'string' && method.icon.trim().startsWith('<svg')
                        ? <span dangerouslySetInnerHTML={{ __html: method.icon }} />
                        : typeof method.icon === 'string' && method.icon.match(/\.(png|jpg|jpeg|webp)$/i)
                          ? <img src={method.icon} alt={`${method.title} icon`} className="w-8 h-8 object-contain" />
                          : getCompanyIconNode(method.icon?.toLowerCase().replace(' ', ''))}
                    </div>
                    <div>
                      <h3 className="text-start font-medium">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  <RadioGroupItem value={method.title} id={method.title} />
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Right side: Order Summary */}
        <div className="sticky top-24 w-full h-full">
          <div className="bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-[#1F1F23] p-6 flex flex-col gap-4 h-full">
            <h3 className="text-xl font-bold">Order Summary</h3>

            <div className="flex flex-col gap-4 h-full">
              <div>
                <Label htmlFor="months-input" className="font-medium text-gray-300 mb-2 block">Select Months</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleMonthChange(-1)}
                    disabled={months <= 1}
                    className="h-12 w-12"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input id="months-input" type="number" value={months} readOnly className="h-12 flex-grow text-center bg-transparent text-lg font-bold" />
                  <Button size="icon" variant="outline" onClick={() => handleMonthChange(1)} className="h-12 w-12">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="discount-code" className="font-medium text-gray-300">Discount Code</Label>
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-grow">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="discount-code"
                      placeholder="Enter your code"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value)}
                      className="pl-10 bg-transparent h-12"
                    />
                  </div>
                  <Button variant="secondary" className="h-12 px-6">Apply</Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-[#1F1F23]">
              <div className="flex justify-between text-sm text-gray-400">
                <p>
                  {selectedTier}
                  {' '}
                  Plan x
                  {months}
                  {' '}
                  month(s)
                </p>
                <p>
                  $
                  {totalPrice.toFixed(2)}
                </p>
              </div>
              {discountCode && (
                <div className="flex justify-between text-sm text-green-400">
                  <p>Discount Applied</p>
                  <p>-$... </p>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2">
                <p>Total</p>
                <p>
                  $
                  {totalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <Button
              loading={isPending}
              disabled={isPending}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg"
              onClick={handleCreatePayment}
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
