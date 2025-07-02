import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ReferralStep } from "./steps/referral-step"
import { CompanyDetectionStep } from "./steps/company-detection-step"
import { NoCompanyStep } from "./steps/no-company-step"
import { Progress } from "@/components/ui/progress"

export interface OnboardingData {
  referralCode?: string
  detectedCompany?: DetectedCompany
  noCompanyAcknowledged?: boolean
}

export interface DetectedCompany {
  name: string
  description: string
  benefits: string[]
}

export interface SupportedCompany {
  name: string
  description: string
  logo?: string
  tier: "premium" | "standard" | "partner"
}

export interface SupportContact {
  platform: string
  handle: string
  displayText: string
}

interface OnboardingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: OnboardingData) => void
  detectedCompanies?: DetectedCompany[]
  supportedCompanies?: SupportedCompany[]
  supportContact?: SupportContact
  hasCompanyDetection?: boolean
}

export function OnboardingDialog({
  open,
  onOpenChange,
  onComplete,
  detectedCompanies = [
    {
      name: "Boost Royal",
      description: "Premium boosting service with exclusive high-tier accounts",
      benefits: ["Exclusive Diamond+ accounts", "Priority support", "Custom rank packages"],
    },
    {
      name: "Turbo Boost",
      description: "Fast and reliable account services for competitive players",
      benefits: ["Verified accounts", "24/7 availability", "Money-back guarantee"],
    },
  ],
  supportedCompanies = [
    {
      name: "Boost Royal",
      description: "Premium boosting service with exclusive high-tier accounts",
      tier: "premium",
    },
    {
      name: "Turbo Boost",
      description: "Fast and reliable account services for competitive players",
      tier: "premium",
    },
    {
      name: "Elite Gaming",
      description: "Professional esports organization with competitive accounts",
      tier: "partner",
    },
    {
      name: "Rank Masters",
      description: "Specialized in high-rank account services",
      tier: "standard",
    },
    {
      name: "Pro Gamers Hub",
      description: "Community-driven gaming service provider",
      tier: "standard",
    },
  ],
  supportContact = {
    platform: "Discord",
    handle: "@naratios",
    displayText: "Contact us on Discord: @naratios",
  },
  hasCompanyDetection = false,
}: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({})

  // Simulate company detection - in real app, this would be actual detection logic
  const isCompanyDetected = hasCompanyDetection && detectedCompanies.length > 0

  const totalSteps = isCompanyDetected ? 2 : 3

  const handleReferralNext = (referralCode?: string) => {
    setData((prev) => ({ ...prev, referralCode }))
    setCurrentStep(2)
  }

  const handleCompanyNext = (detectedCompany?: DetectedCompany) => {
    const finalData = { ...data, detectedCompany }
    onComplete(finalData)
  }

  const handleNoCompanyNext = () => {
    const finalData = { ...data, noCompanyAcknowledged: true }
    onComplete(finalData)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div className="px-6 pt-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <div className="px-6 pb-6">
          {currentStep === 1 && <ReferralStep onNext={handleReferralNext} />}
          {currentStep === 2 && isCompanyDetected && (
            <CompanyDetectionStep companies={detectedCompanies} onNext={handleCompanyNext} onBack={handleBack} />
          )}
          {currentStep === 2 && !isCompanyDetected && (
            <NoCompanyStep
              supportedCompanies={supportedCompanies}
              supportContact={supportContact}
              onNext={handleNoCompanyNext}
              onBack={handleBack}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
