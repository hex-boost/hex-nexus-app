import { CopyToClipboard } from '@/components/CopyToClipboard.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  InnerDialog,
  InnerDialogContent,
  InnerDialogDescription,
  InnerDialogFooter,
  InnerDialogHeader,
  InnerDialogTitle,
  InnerDialogTrigger,
} from '@/components/ui/nested-dialog.tsx';
import { useMutation } from '@tanstack/react-query';
import { Browser } from '@wailsio/runtime';
import { ExternalLink } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export function BoostRoyalInnerDialog({ children }: { children: React.ReactNode }) {
  const transferToken = 'nexus-assign-42';
  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      return Browser.OpenURL('https://discord.gg/Vew8tvRWVZ');
    },
  });
  return (
    <InnerDialog>
      <InnerDialogTrigger asChild>
        {children}
      </InnerDialogTrigger>
      <InnerDialogContent className="p-0">
        <InnerDialogHeader className="border-b p-4">
          <InnerDialogTitle>Boost Royal Balance Payment</InnerDialogTitle>
          <InnerDialogDescription>
            Follow these steps to pay using your BR balance
          </InnerDialogDescription>
        </InnerDialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                1
              </div>
              <div>
                <p className="font-medium">Send the price for your desired plan via Boost Royal transfer balance</p>
                <p className="text-sm text-muted-foreground">Payment is quick and simple through your BR account</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                2
              </div>
              <div>
                <p className="font-medium">Use this transfer token:</p>
                <div className="mt-2 flex items-center gap-4">
                  <code className="rounded bg-shade8 px-3 py-1 font-mono text-sm">{transferToken}</code>
                  <CopyToClipboard
                    className="p-1"
                    onCopied={() => toast.info('Copied to clipboard', {
                      duration: 1300,
                    })}
                    text={transferToken}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                3
              </div>
              <div>
                <p className="font-medium">For multiple months</p>
                <p className="text-sm text-muted-foreground">Simply send the monthly price again for each additional month you want to add</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-primary/10 p-4">
            <p className="text-sm font-medium text-primary">Your payment will be processed automatically and your account upgraded immediately once confirmed</p>
          </div>
        </div>

        <InnerDialogFooter className="flex items-center justify-between border-t px-6 py-4">
          <p className="text-sm text-muted-foreground">Need help with your payment?</p>
          <Button disabled={isPending} loading={isPending} variant="outline" size="sm" onClick={() => mutate()}>
            Contact @Killua on Discord
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </InnerDialogFooter>
      </InnerDialogContent>
    </InnerDialog>
  );
}
