"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift } from "lucide-react"

interface ReferralStepProps {
  onNext: (referralCode?: string) => void
}

export function ReferralStep({ onNext }: ReferralStepProps) {
  const [referralCode, setReferralCode] = useState("")

  const handleNext = () => {
    onNext(referralCode.trim() || undefined)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Got a Referral Code?</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your referral code to unlock exclusive discounts on premium League of Legends accounts
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="referral">Referral Code (Optional)</Label>
          <Input
            id="referral"
            placeholder="Enter your referral code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="text-center font-mono"
          />
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Referral codes provide instant discounts on your first purchase and access to
            exclusive account tiers.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  )
}
