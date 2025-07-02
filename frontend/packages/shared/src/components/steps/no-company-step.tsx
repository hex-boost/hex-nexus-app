"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, ArrowLeft, MessageCircle, AlertCircle } from "lucide-react"
import type { SupportedCompany, SupportContact } from "../onboarding-dialog"

interface NoCompanyStepProps {
  supportedCompanies: SupportedCompany[]
  supportContact: SupportContact
  onNext: () => void
  onBack: () => void
}

const getTierColor = (tier: SupportedCompany["tier"]) => {
  switch (tier) {
    case "premium":
      return "bg-primary text-primary-foreground"
    case "partner":
      return "bg-secondary text-secondary-foreground"
    case "standard":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getTierLabel = (tier: SupportedCompany["tier"]) => {
  switch (tier) {
    case "premium":
      return "Premium"
    case "partner":
      return "Partner"
    case "standard":
      return "Standard"
    default:
      return "Standard"
  }
}

export function NoCompanyStep({ supportedCompanies, supportContact, onNext, onBack }: NoCompanyStepProps) {
  const handleContactSupport = () => {
    // In a real app, this could open Discord or copy the handle to clipboard
    navigator.clipboard?.writeText(supportContact.handle)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">No Company Detected</h2>
        <p className="text-sm text-muted-foreground mt-2">
          We couldn't automatically detect your company affiliation. You can still access our services with standard
          pricing.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Supported Companies
          </h3>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {supportedCompanies.map((company, index) => (
              <Card key={index} className="border-muted">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{company.name}</h4>
                        <Badge variant="outline" className={getTierColor(company.tier)}>
                          {getTierLabel(company.tier)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{company.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Don't see your company?</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  We're always adding new company partnerships. Suggest your company for inclusion and get access to
                  exclusive benefits.
                </p>
                <Button variant="outline" size="sm" onClick={handleContactSupport} className="text-xs bg-transparent">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {supportContact.displayText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> You can still access all our services. Company affiliations provide additional
            discounts and exclusive account tiers.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  )
}
