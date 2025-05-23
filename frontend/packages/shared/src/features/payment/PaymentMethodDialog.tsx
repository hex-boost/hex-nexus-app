import type { PaymentMethodsAccepted } from '@/types/membership.ts';
import type { PremiumTiers } from '@/types/types.ts';
import { BoostRoyalInnerDialog } from '@/components/BoostRoyalInnerDialog.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
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
import { ExternalLink } from 'lucide-react';
import * as React from 'react';
import { cls } from 'react-image-crop';

export function PaymentMethodDialog({ children, selectedTier }: {
  selectedTier: PremiumTiers;
  children: React.ReactNode;
}) {
  const {
    paymentMethods,
    handlePayment,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isPending,
  } = useMembershipActions();

  const handleContinue = async () => {
    if (selectedPaymentMethod === 'BR Balance') {
      // Add BR Balance specific handling here
      console.log('BR Balance selected - implement InnerDialog logic');
    } else {
      handlePayment(selectedTier);
      console.log('Proceeding with', selectedPaymentMethod);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Choose a payment method</DialogTitle>
          <DialogDescription>
            Select your preferred payment option
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={(value: PaymentMethodsAccepted) => setSelectedPaymentMethod(value)}
          >
            {paymentMethods.map(method => (
              <div
                key={method.title}
                className={cls(`flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-primary/10 ${
                  selectedPaymentMethod === method.title ? 'bg-primary/20  border-blue-500' : ''
                }`, method.title.includes('Turbo Boost Balance') && 'disabled pointer-events-none opacity-60')}
                onClick={() => setSelectedPaymentMethod(method.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPaymentMethod(method.title);
                  }
                }}
                role="radio"
                aria-checked={selectedPaymentMethod === method.title}
                tabIndex={0}
              >
                <div className="flex items-center justify-center space-x-4">
                  {
                    method.title.includes('Turbo Boost Balance')
                      ? (
                          <div
                            className=" w-8 flex items-center justify-center"
                          >
                            <img alt="Turbo Boost Logo" src={method.icon} />
                          </div>
                        )

                      : (
                          <div
                            className="h-8 w-8 flex items-center justify-center"
                            /* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */
                            dangerouslySetInnerHTML={{ __html: method.icon }}
                          />
                        )
                  }
                  <div>
                    <div className="flex gap-4">
                      <h3 className="text-sm font-medium">{method.title}</h3>

                      {method.title.includes('Turbo Boost Balance') && (
                        <Badge className="rounded-full ">
                          Coming Soon
                        </Badge>
                      )}
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

        <DialogFooter
          className="flex flex-col items-center justify-between space-y-2 border-t px-4 py-2 sm:flex-row sm:space-y-0"
        >

          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          {
            !(selectedPaymentMethod.includes('BR'))
              ? (
                  <Button
                    loading={isPending}
                    disabled={isPending}

                    className="w-full sm:w-auto"
                    onClick={handleContinue}
                  >
                    Continue
                    <ExternalLink width={14} height={14} className="ml-2" />
                  </Button>
                )
              : (
                  <BoostRoyalInnerDialog>
                    <Button
                      loading={isPending}
                      className="w-full sm:w-auto relative"
                      onClick={handleContinue}
                    >
                      Continue
                    </Button>
                  </BoostRoyalInnerDialog>
                )

          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
