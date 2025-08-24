import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import type { PremiumTiers } from '@/types/types.ts';
// import { PaymentProviderTutorial } from '@/components/PaymentProviderTutorial.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/nested-dialog.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { useMembershipActions } from '@/hooks/useMembershipActions.ts';
import { ExternalLink, Minus, Plus, Ticket } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { cls } from 'react-image-crop';
import { toast } from 'sonner';

export function PaymentMethodDialog({ children, selectedTier }: {
  selectedTier: PremiumTiers;
  children: React.ReactNode;
}) {
  const {
    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isPending,
    // @ts-ignore
    createSubscriptionPayment,
  } = useMembershipActions();

  const [months, setMonths] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [showTutorial, setShowTutorial] = useState<string | null>(null);

  const handleMonthChange = (amount: number) => {
    setMonths(prev => Math.max(1, prev + amount));
  };

  const handleCreatePayment = async () => {
    try {
      const response = await createSubscriptionPayment({
        gateway: selectedPaymentMethod,
        desiredPlan: selectedTier,
        desiredMonths: months,
        discountCodeString: discountCode,
      });

      toast.success(response.message);
      setShowTutorial(selectedPaymentMethod);

      setTimeout(() => {
        window.location.href = `/payments/${response.payment.documentId}`;
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment.');
    }
  };

  const tierPricePerMonth = 15; // This should be dynamic
  const totalPrice = tierPricePerMonth * months;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Configure your plan and choose a payment method.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 p-4">
          <div>
            <Label htmlFor="months-input" className="font-medium">Select Months</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button size="icon" variant="outline" onClick={() => handleMonthChange(-1)} disabled={months <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input id="months-input" type="number" value={months} readOnly className="w-16 text-center" />
              <Button size="icon" variant="outline" onClick={() => handleMonthChange(1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="discount-code" className="font-medium">Discount Code</Label>
            <div className="flex items-center gap-2 mt-2">
              <div className="relative flex-grow">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discount-code"
                  placeholder="Enter your code"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="secondary">Apply</Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Choose a payment method</h3>
            <RadioGroup
              value={selectedPaymentMethod}
              onValueChange={(value: PaymentMethodsAccepted) => setSelectedPaymentMethod(value)}
            >
              {paymentMethods.map(method => (
                <div
                  key={method.title}
                  className={cls(`flex cursor-pointer items-center justify-between rounded-lg border p-4 mb-2 hover:bg-primary/10 ${
                    selectedPaymentMethod === method.title ? 'bg-primary/20  border-blue-500' : ''
                  }`)}
                  onClick={() => setSelectedPaymentMethod(method.title)}
                  role="radio"
                  aria-checked={selectedPaymentMethod === method.title}
                  tabIndex={0}
                >
                  <div className="flex items-center justify-center space-x-4">
                    <div
                      className="h-8 w-8 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: method.icon }}
                    />
                    <div>
                      <div className="flex gap-4">
                        <h3 className="text-sm font-medium">{method.title}</h3>
                      </div>
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

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <p className="text-muted-foreground">
                {selectedTier}
                {' '}
                Plan x
                {' '}
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
              <div className="flex justify-between text-sm text-green-600">
                <p>Discount Applied</p>
                <p>-$... (logic to be implemented)</p>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <p>Total</p>
              <p>
                $
                {totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter
          className="flex flex-col items-center justify-between space-y-2 border-t px-4 py-2 sm:flex-row sm:space-y-0"
        >
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            loading={isPending}
            disabled={isPending}
            className="w-full sm:w-auto"
            onClick={handleCreatePayment}
          >
            Proceed to Payment
            <ExternalLink width={14} height={14} className="ml-2" />
          </Button>
        </DialogFooter>
        {/* {showTutorial && <PaymentProviderTutorial provider={showTutorial} onClose={() => setShowTutorial(null)} />} */}
      </DialogContent>
    </Dialog>
  );
}
