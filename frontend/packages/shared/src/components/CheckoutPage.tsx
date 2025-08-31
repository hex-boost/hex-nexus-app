import type { PlanWithPrice } from '@/features/payment/types/pricing.ts';
import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import { PricingCard } from '@/components/checkout/PricingCard.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { useMembershipActions } from '@/hooks/useMembershipActions.ts';
import { useMembershipPrices } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import { ArrowLeft, CreditCard, Minus, Plus, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cls } from 'react-image-crop';

export function CheckoutPage({ selectedPlan, onBack }: { selectedPlan: PlanWithPrice; onBack: () => void }) {
  const {
    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    createSubscriptionPayment, // Use the new mutation
    isCreatingPayment, // Use the new pending state
  } = useMembershipActions();
  const { pricesData, pricesLoading, selectedCurrency, setSelectedCurrency } = useMembershipPrices();

  const [months, setMonths] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (selectedPaymentMethod === 'BR Balance') {
      setSelectedCurrency('USD');
    } else if (selectedPaymentMethod === 'Turbo Boost Balance') {
      setSelectedCurrency('EUR');
    } else if (selectedPaymentMethod === 'Pix') {
      setSelectedCurrency('BRL');
    }
  }, [selectedPaymentMethod, setSelectedCurrency]);

  const handleMonthChange = (amount: number) => {
    setMonths(prev => Math.max(1, prev + amount));
  };
  const paymentMapping: Record<string, string> = {
    mercadopago: 'mercadoPago',
    boostroyal: 'boostRoyal',
    stripe: 'stripe',
    turboboost: 'turboBoost',
    nowPayments: 'nowPayments',
  };
  const handleCreatePayment = () => {
    // Call the mutation with the payment details
    createSubscriptionPayment({
      gateway: paymentMapping[selectedPaymentMethod.toLowerCase()] as PaymentMethodsAccepted,
      desiredPlan: selectedPlan.tier_enum,
      desiredMonths: months,
      discountCodeString: discountCode,
      currency: selectedCurrency,
    });
  };

  // Get the price for the current plan based on the selected currency from the hook's data
  const currentPrice = pricesData?.prices?.[selectedPlan.tier_enum.toLowerCase() as keyof typeof pricesData.prices];

  // This new plan object ensures the PricingCard on the left also updates its price
  const tierPricePerMonth = currentPrice !== undefined ? currentPrice / 100 : 0;
  const totalPrice = tierPricePerMonth * months;

  const totalPlanPrice = currentPrice ? currentPrice * months : 0;
  const planForDisplay: PlanWithPrice = {
    ...selectedPlan,
    price: totalPlanPrice,
  };

  const currencies: { name: Currency; symbol: string }[] = [
    { name: 'USD', symbol: '$' },
    { name: 'EUR', symbol: '€' },
    { name: 'BRL', symbol: 'R$' },
  ];
  const currencySymbol = currencies.find(c => c.name === selectedCurrency)?.symbol || '$';
  const isCurrencyChangeDisabled = selectedPaymentMethod !== 'Stripe';

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
            plan={planForDisplay}
            selectedCurrency={selectedCurrency}
            onCheckout={() => {}}
            isLoading={pricesLoading}
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
                      {
                        method.icon
                      }

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

              <div>
                <Label className="font-medium text-gray-300 mb-2 block">Currency</Label>
                <div className="flex items-center gap-2">
                  {currencies.map(currency => (
                    <Button
                      key={currency.name}
                      variant={selectedCurrency === currency.name ? 'secondary' : 'outline'}
                      onClick={() => setSelectedCurrency(currency.name)}
                      disabled={isCurrencyChangeDisabled || pricesLoading}
                      className="w-full"
                    >
                      {currency.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-[#1F1F23]">
              {pricesLoading
                ? (
                    <div className="flex justify-between text-sm">
                      <div className="h-5 w-32 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                      <div className="h-5 w-16 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                    </div>
                  )
                : (
                    <div className="flex justify-between text-sm text-gray-400">
                      <p>
                        {planForDisplay.tier_enum}
                        {' '}
                        Plan x
                        {months}
                        {' '}
                        month(s)
                      </p>
                      <p>
                        {currencySymbol}
                        {totalPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
              {discountCode && (
                <div className="flex justify-between text-sm text-green-400">
                  <p>Discount Applied</p>
                  <p>-$... </p>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2">
                <p>Total</p>
                {' '}
                {pricesLoading
                  ? (
                      <div className="h-7 w-20 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                    )
                  : (
                      <p>
                        {currencySymbol}
                        {totalPrice.toFixed(2)}
                      </p>
                    )}
              </div>
            </div>

            <Button
              loading={isCreatingPayment || pricesLoading}
              disabled={isCreatingPayment || pricesLoading}
              className=""
              onClick={handleCreatePayment}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
