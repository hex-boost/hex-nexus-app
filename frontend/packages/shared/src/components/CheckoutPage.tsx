// --- START OF FILE CheckoutPage.tsx ---

import type { PlanWithPrice } from '@/features/payment/types/pricing.ts';
import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import { PricingCard } from '@/components/checkout/PricingCard.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { useMembershipActions } from '@/hooks/useMembershipActions.ts';
import { useMembershipPrices } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import { PaymentMethodEnum } from '@/types/membership.ts';
import { ArrowLeft, CreditCard, Minus, Plus, Ticket, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cls } from 'react-image-crop';

const getCurrencySymbol = (currency: Currency) => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'BRL':
      return 'R$';
    default:
      return '$';
  }
};

export function CheckoutPage({ selectedPlan, onBack }: { selectedPlan: PlanWithPrice; onBack: () => void }) {
  const {
    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    createSubscriptionPayment,
    isCreatingPayment,
  } = useMembershipActions();

  const [months, setMonths] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const { pricesData, pricesLoading, selectedCurrency, setSelectedCurrency } = useMembershipPrices(
    months,
    appliedDiscountCode,
  );

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (selectedPaymentMethod === PaymentMethodEnum.BoostRoyal) {
      setSelectedCurrency('USD');
    } else if (selectedPaymentMethod === PaymentMethodEnum.TurboBoost) {
      setSelectedCurrency('EUR');
    } else if (selectedPaymentMethod === PaymentMethodEnum.MercadoPago) {
      setSelectedCurrency('BRL');
    }
  }, [selectedPaymentMethod, setSelectedCurrency]);

  // Separate discounts into different types for UI logic
  const { appliedCodeDiscount } = useMemo(() => {
    const allDiscounts = pricesData?.prices?.discounts || [];
    return {
      appliedCodeDiscount: allDiscounts.find(d => d.type === 'discount_code'),
    };
  }, [pricesData]);

  const handleMonthChange = (amount: number) => {
    setMonths(prev => Math.max(1, prev + amount));
  };

  const handleApplyDiscount = () => {
    setAppliedDiscountCode(discountCode);
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setAppliedDiscountCode('');
  };

  const handleCreatePayment = () => {
    createSubscriptionPayment({
      gateway: selectedPaymentMethod,
      desiredPlan: selectedPlan.tier_enum,
      desiredMonths: months,
      discountCodeString: appliedDiscountCode,
      desiredCurrency: selectedCurrency,
    });
  };

  const currentPrice = pricesData?.prices?.[selectedPlan.tier_enum.toLowerCase() as keyof typeof pricesData.prices] as number | undefined;
  const totalPrice = currentPrice ? currentPrice / 100 : 0;

  const planForDisplay: PlanWithPrice = {
    ...selectedPlan,
    price: currentPrice ?? 0,
  };

  const currencies: { name: Currency; symbol: string }[] = [
    { name: 'USD', symbol: '$' },
    { name: 'EUR', symbol: '€' },
    { name: 'BRL', symbol: 'R$' },
  ];
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const isCurrencyChangeDisabled = selectedPaymentMethod !== PaymentMethodEnum.Stripe;

  const getDiscountDisplayName = (type: string) => {
    switch (type) {
      case 'newUser':
        return 'New User Discount';
      case 'referral':
        return 'Referral Discount';
      case 'loyalty':
        return 'Loyalty';
      default:
        return 'Discount Code';
    }
  };

  return (
    <div className=" mx-auto p-4 text-white">
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
              onValueChange={(value: PaymentMethodEnum) => setSelectedPaymentMethod(value)}
            >
              {paymentMethods.map(method => (
                <div
                  key={method.title}
                  className={cls(`flex border border-transparent cursor-pointer items-center justify-between gap-4 rounded-lg  p-4 hover:bg-primary/5 hover:border-purple-400/10 transition-all ${
                    selectedPaymentMethod === method.method ? 'bg-primary/20 border-purple-400' : 'dark:border-[#1F1F23]'
                  }`)}
                  onClick={() => setSelectedPaymentMethod(method.method)}
                  role="radio"
                  aria-checked={selectedPaymentMethod === method.method}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">{method.icon}</div>
                    <div>
                      <h3 className="text-start font-medium">{method.title}</h3>
                      <p className="text-start text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <RadioGroupItem value={method.title} id={method.title} />
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Right side: Order Summary */}
        <div className=" top-24 w-full h-full">
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
                {!appliedCodeDiscount && (
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
                    <Button
                      variant="secondary"
                      className="h-12 px-6"
                      onClick={handleApplyDiscount}
                      disabled={!discountCode || pricesLoading}
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {appliedCodeDiscount && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-sm p-2">
                      {appliedDiscountCode.toUpperCase()}
                      {' '}
                      (-
                      {appliedCodeDiscount.value}
                      {appliedCodeDiscount.isPercentage ? '%' : ''}
                      )
                      <Button variant="ghost" size="icon" className="h-4 w-4 ml-2 hover:bg-red-500/20" onClick={handleRemoveDiscount}>
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </div>
                )}
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
              <div className="flex justify-between text-sm text-gray-400">
                <p>
                  {planForDisplay.tier_enum}
                  {' '}
                  Plan x
                  {months}
                  {' '}
                  month(s)
                </p>
                {/* We don't show the original price here as the API returns the final price */}
              </div>

              {pricesData?.prices?.discounts?.map(discount => (
                <div key={discount.type} className="flex justify-between text-sm text-green-400">
                  <p>{getDiscountDisplayName(discount.type)}</p>
                  <p>
                    -
                    {discount.value}
                    {discount.isPercentage ? '%' : ''}
                  </p>
                </div>
              ))}

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
