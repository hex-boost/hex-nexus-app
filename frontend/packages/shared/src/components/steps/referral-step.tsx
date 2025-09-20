import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type ReferralStepProps = {
  onNext: (referralCode?: string) => void;
};

export function ReferralStep({ onNext }: ReferralStepProps) {
  const [referralCode, setReferralCode] = useState('');

  const handleNext = () => {
    onNext(referralCode || undefined);
  };

  return (
    <>
      <DialogHeader className="text-center">
        <DialogTitle>Welcome! Do you have a referral code?</DialogTitle>
        <DialogDescription>
          Enter a referral code to unlock exclusive benefits (optional)
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="referral">Referral Code</Label>
          <Input
            id="referral"
            value={referralCode}
            onChange={e => setReferralCode(e.target.value)}
            placeholder="Enter referral code"
          />
        </div>

        <div className="bg-muted/10 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡
            {' '}
            <strong>Tip:</strong>
            {' '}
            Referral codes can provide access to exclusive
            discounts.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>
          {referralCode ? 'Apply Code & Continue' : 'Skip for now'}
        </Button>
      </div>
    </>
  );
}
