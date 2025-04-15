import type { PremiumTiers } from '@/types/types.ts';
import { BoostRoyalInnerDialog } from '@/components/BoostRoyalInnerDialog.tsx';
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
} from '@/components/ui/nested-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMembership } from '@/hooks/useMembership.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { Stripe } from '@stripe';
import { useMutation } from '@tanstack/react-query';
import { Browser } from '@wailsio/runtime';
import { ExternalLink } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export function PaymentMethodDialog({ children, selectedTier }: { selectedTier: PremiumTiers; children: React.ReactNode }) {
  const { user } = useUserStore();
  const { createStripeSubscription, createPixPayment } = useMembership();
  const paymentMethods = [
    {
      title: 'Pix',
      description: 'Pay with pix directly from your bank account',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32px" height="32px" baseProfile="basic"><path fill="#4db6ac" d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76 l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"/><path fill="#4db6ac" d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76 l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"/><path fill="#4db6ac" d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0 l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17 l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26 C46.65,21.88,46.65,26.12,44.04,28.74z"/></svg>',
      isExternal: true,
    },
    {
      title: 'Stripe',
      description: 'Pay with Visa, Mastercard, or American Express',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32px" height="32px" fill="#6772e5"><path d="M111.328 15.602c0-4.97-2.415-8.9-7.013-8.9s-7.423 3.924-7.423 8.863c0 5.85 3.32 8.8 8.036 8.8 2.318 0 4.06-.528 5.377-1.26V19.22a10.246 10.246 0 0 1-4.764 1.075c-1.9 0-3.556-.67-3.774-2.943h9.497a39.64 39.64 0 0 0 .063-1.748zm-9.606-1.835c0-2.186 1.35-3.1 2.56-3.1s2.454.906 2.454 3.1zM89.4 6.712a5.434 5.434 0 0 0-3.801 1.509l-.254-1.208h-4.27v22.64l4.85-1.032v-5.488a5.434 5.434 0 0 0 3.444 1.265c3.472 0 6.64-2.792 6.64-8.957.003-5.66-3.206-8.73-6.614-8.73zM88.23 20.1a2.898 2.898 0 0 1-2.288-.906l-.03-7.2a2.928 2.928 0 0 1 2.315-.96c1.775 0 2.998 2 2.998 4.528.003 2.593-1.198 4.546-2.995 4.546zM79.25.57l-4.87 1.035v3.95l4.87-1.032z" fill-rule="evenodd"/><path d="M74.38 7.035h4.87V24.04h-4.87z"/><path d="M69.164 8.47l-.302-1.434h-4.196V24.04h4.848V12.5c1.147-1.5 3.082-1.208 3.698-1.017V7.038c-.646-.232-2.913-.658-4.048 1.43zm-9.73-5.646L54.698 3.83l-.02 15.562c0 2.87 2.158 4.993 5.038 4.993 1.585 0 2.756-.302 3.405-.643v-3.95c-.622.248-3.683 1.138-3.683-1.72v-6.9h3.683V7.035h-3.683zM46.3 11.97c0-.758.63-1.05 1.648-1.05a10.868 10.868 0 0 1 4.83 1.25V7.6a12.815 12.815 0 0 0-4.83-.888c-3.924 0-6.557 2.056-6.557 5.488 0 5.37 7.375 4.498 7.375 6.813 0 .906-.78 1.186-1.863 1.186-1.606 0-3.68-.664-5.307-1.55v4.63a13.461 13.461 0 0 0 5.307 1.117c4.033 0 6.813-1.992 6.813-5.485 0-5.796-7.417-4.76-7.417-6.943zM13.88 9.515c0-1.37 1.14-1.9 2.982-1.9A19.661 19.661 0 0 1 25.6 9.876v-8.27A23.184 23.184 0 0 0 16.862.001C9.762.001 5 3.72 5 9.93c0 9.716 13.342 8.138 13.342 12.326 0 1.638-1.4 2.146-3.37 2.146-2.905 0-6.657-1.202-9.6-2.802v8.378A24.353 24.353 0 0 0 14.973 32C22.27 32 27.3 28.395 27.3 22.077c0-10.486-13.42-8.613-13.42-12.56z" fill-rule="evenodd"/></svg>',
      isExternal: true,
    },
    {
      title: 'BR Balance',
      description: 'Pay using your boost royal balance',
      icon: '<svg height="32" width="32" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 39 39"><g clip-path="url(#logo-icon_svg__a)"><circle cx="19.797" cy="19.02" r="13.586" fill="#0F061E"></circle><path fill="url(#logo-icon_svg__b)" d="M19.408 0a19.408 19.408 0 1 0 0 38.817 19.408 19.408 0 0 0 0-38.817M8.757 26.652l-.45-11.816 5.667 4.89 7.965 6.926zm15.527 0-9.534-8.268 4.658-7.71 9.673 15.978zm5.845-1.227-4.285-7.127 4.658-3.462z"></path></g><defs><linearGradient id="logo-icon_svg__b" x1="0" x2="38.817" y1="19.408" y2="19.408" gradientUnits="userSpaceOnUse"><stop stop-color="#FF7E45"></stop><stop offset="1" stop-color="#FF6550"></stop></linearGradient><clipPath id="logo-icon_svg__a"><path fill="#fff" d="M0 0h38.817v38.817H0z"></path></clipPath></defs></svg>',
    },
  ];
    type PaymentMethodTitle = (typeof paymentMethods)[number]['title'];

    const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethodTitle>(paymentMethods[0].title);

    // 1. First get callback URLs from local Go server

    const { isPending, mutate: handlePayment } = useMutation({
      mutationKey: ['payment', selectedPaymentMethod],
      mutationFn: async () => {
        if (user?.premium?.tier !== 'free') {
          throw new Error('You already have a plan');
        }
        let url: string = '';
        if (selectedPaymentMethod === 'Pix') {
          const pixResponse = await createPixPayment({ membershipEnum: selectedTier });
          url = pixResponse.data.point_of_interaction?.transaction_data?.ticket_url as string;
        }
        if (selectedPaymentMethod === 'Stripe') {
          const [successUrl, cancelUrl] = await Stripe.GetCallbackURLs();
          const stripeResponse = await createStripeSubscription({ subscriptionTier: selectedTier.toLowerCase(), cancelUrl, successUrl });
          url = stripeResponse.url;
        }
        await Browser.OpenURL(url);
      },
      onError: (error) => {
        if (error.message) {
          toast.warning(error.message);
        }
      },
    });

    const handleContinue = async () => {
      if (selectedPaymentMethod === 'BR Balance') {
      // Add BR Balance specific handling here
        console.log('BR Balance selected - implement InnerDialog logic');
      } else {
        handlePayment();
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
                  <div className="flex items-center justify-center space-x-4">

                    <div
                      className="h-8 w-8 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: method.icon }}
                    />
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
                        className="w-full sm:w-auto"
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
