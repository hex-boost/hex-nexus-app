import { CopyToClipboard } from '@/components/CopyToClipboard.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useMutation } from '@tanstack/react-query';
import { Browser } from '@wailsio/runtime';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Define the shape of instruction steps
type InstructionStep = {
  title: string;
  description: string;
  code?: string;
};

// Define the data for different payment methods
const paymentInstructionData = {
  'Boost Royal': {
    title: 'Boost Royal Balance Payment',
    description: 'Follow these steps to pay using your BR balance.',
    steps: [
      {
        title: 'Send the price for your desired plan via Boost Royal transfer balance',
        description: 'Payment is quick and simple through your BR account.',
      },
      {
        title: 'Use this transfer token:',
        description: 'Click to copy the token below.',
        code: 'nexus-assign-42',
      },
      {
        title: 'For multiple months',
        description: 'Simply send the monthly price again for each additional month you want to add.',
      },
    ],
    footerNote: 'Your payment will be processed automatically and your account upgraded immediately once confirmed.',
    help: {
      text: 'Need help with your payment?',
      buttonText: 'Contact @Killua on Discord',
      action: () => Browser.OpenURL('https://discord.gg/Vew8tvRWVZ'),
    },
  },
  'Turbo': {
    title: 'Turbo Balance Payment',
    description: 'Follow these steps to pay using your Turbo balance.',
    steps: [
      {
        title: 'Open a ticket in our Discord server',
        description: 'Our support team will handle your request promptly.',
      },
      {
        title: 'Provide your username and desired plan',
        description: 'Mention the plan you wish to purchase and for how many months.',
      },
      {
        title: 'Await instructions from an admin',
        description: 'An admin will guide you through the balance transfer process.',
      },
    ],
    footerNote: 'Your account will be upgraded manually by our team once the payment is confirmed.',
    help: {
      text: 'Having trouble?',
      buttonText: 'Go to Discord',
      action: () => Browser.OpenURL('https://discord.gg/your-turbo-discord'), // Replace with your Turbo discord link
    },
  },
};

type PaymentInstructionsProps = {
  paymentMethod: keyof typeof paymentInstructionData;
};

export function PaymentInstructions({ paymentMethod }: PaymentInstructionsProps) {
  const data = paymentInstructionData[paymentMethod];
  const { mutate, isPending } = useMutation({ mutationFn: data.help.action });

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          Payment instructions for
          {paymentMethod}
          {' '}
          are not available.
        </p>
        <p className="text-sm text-muted-foreground">Please contact support for assistance.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-[#1F1F23] p-6">
        <h3 className="text-xl font-bold">{data.title}</h3>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {data.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                {index + 1}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-white">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.code && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded bg-black/40 px-3 py-1.5 font-mono text-sm">{step.code}</code>
                    <CopyToClipboard
                      className="p-1"
                      onCopied={() => toast.info('Copied to clipboard', { duration: 1300 })}
                      text={step.code}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-purple-600/10 p-4">
          <p className="text-sm font-medium text-purple-400">{data.footerNote}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#1F1F23] px-6 py-4">
        <p className="text-sm text-muted-foreground">{data.help.text}</p>
        <Button disabled={isPending} loading={isPending} variant="outline" size="sm" onClick={() => mutate()}>
          {data.help.buttonText}
          <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
