import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, CheckCircle } from "lucide-react"
import type { DetectedCompany } from "../onboarding-dialog"

interface CompanyDetectionStepProps {
  companies: DetectedCompany[]
  onNext: (detectedCompany?: DetectedCompany) => void
  onBack: () => void
}

export function CompanyDetectionStep({ companies, onNext, onBack }: CompanyDetectionStepProps) {
  const detectedCompany = companies[0] // Simulate detection of first company

  const handleNext = () => {
    onNext(detectedCompany)
  }

  return (
    <>
      <DialogHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <DialogTitle>Company Detected!</DialogTitle>
        <DialogDescription>We've automatically recognized your company affiliation</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="border rounded-lg p-4 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{detectedCompany.name}</h3>
            <Badge variant="secondary">Verified</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{detectedCompany.description}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium">Exclusive Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {detectedCompany.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            🎯 <strong>Great news!</strong> Your company has access to our premium account catalog with special pricing
            and priority support.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext}>Get Started</Button>
      </div>
    </>
  )
}
