import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InnerDialog,
  InnerDialogContent,
  InnerDialogDescription,
  InnerDialogFooter,
  InnerDialogHeader,
  InnerDialogTitle,
  InnerDialogTrigger,
} from '@/components/ui/nested-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import * as React from 'react';

export function PaymentMethodDialog({ children, selectedTier }: { selectedTier: string; children: React.ReactNode }) {
  const paymentMethods = [
    {
      title: 'Pix',
      description: 'Pay with pix directly from your bank account',
      icon: 'https://i0.wp.com/protetor.app/wp-content/uploads/2024/01/Logo-Pix-Png.webp?ssl=1',
      isExternal: true,
    },
    {
      title: 'Stripe',
      description: 'Pay with Visa, Mastercard, or American Express',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
      isExternal: true,
    },
    {
      title: 'BR Balance',
      description: 'Pay using your boost royal balance',
      icon: '<svg height="39" width="39" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 39 39"><g clip-path="url(#logo-icon_svg__a)"><circle cx="19.797" cy="19.02" r="13.586" fill="#0F061E"></circle><path fill="url(#logo-icon_svg__b)" d="M19.408 0a19.408 19.408 0 1 0 0 38.817 19.408 19.408 0 0 0 0-38.817M8.757 26.652l-.45-11.816 5.667 4.89 7.965 6.926zm15.527 0-9.534-8.268 4.658-7.71 9.673 15.978zm5.845-1.227-4.285-7.127 4.658-3.462z"></path></g><defs><linearGradient id="logo-icon_svg__b" x1="0" x2="38.817" y1="19.408" y2="19.408" gradientUnits="userSpaceOnUse"><stop stop-color="#FF7E45"></stop><stop offset="1" stop-color="#FF6550"></stop></linearGradient><clipPath id="logo-icon_svg__a"><path fill="#fff" d="M0 0h38.817v38.817H0z"></path></clipPath></defs></svg>',
    },
  ];

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState(paymentMethods[0].title);

  const handleContinue = () => {
    if (selectedPaymentMethod === 'BR Balance') {
      // Add BR Balance specific handling here
      console.log('BR Balance selected - implement InnerDialog logic');
    } else {
      // Handle other payment methods
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
            onValueChange={setSelectedPaymentMethod}
          >
            {paymentMethods.map(method => (
              <div
                key={method.title}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent ${
                  selectedPaymentMethod === method.title ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedPaymentMethod(method.title)}
              >
                <div className="flex items-center space-x-4">
                  {method.icon.startsWith('http')
                    ? (
                        <img src={method.icon} alt={method.title} className="h-8 w-8 object-contain" />
                      )
                    : (
                        <div
                          className="h-8 w-8"
                          dangerouslySetInnerHTML={{ __html: method.icon }}
                        />
                      )}
                  <div>
                    <h3 className="text-sm font-medium">{method.title}</h3>
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

        <DialogFooter className="flex flex-col items-center justify-between space-y-2 border-t px-4 py-2 sm:flex-row sm:space-y-0">
          <InnerDialog>
            <InnerDialogTrigger asChild>
              {/* <Button */}
              {/*  className="" */}
              {/* /> */}
            </InnerDialogTrigger>
            <InnerDialogContent className="-mt-6 p-0 sm:-mt-1">
              <InnerDialogHeader className="border-b p-4">
                <InnerDialogTitle>BR Balance Payment</InnerDialogTitle>
                <InnerDialogDescription>
                  Handle BR Balance payment here
                </InnerDialogDescription>
              </InnerDialogHeader>
              <InnerDialogFooter className="flex flex-col items-center justify-between space-y-2 border-t px-4 py-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                {/* Add BR Balance specific footer content here */}
              </InnerDialogFooter>
            </InnerDialogContent>
          </InnerDialog>
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="w-full sm:w-auto"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
