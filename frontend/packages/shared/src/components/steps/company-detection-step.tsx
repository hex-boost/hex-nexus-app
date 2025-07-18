import type { DetectedCompany, SupportContact, SupportedCompany } from '../onboarding-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMapping } from '@/lib/useMapping.tsx';
import { AlertCircle, ArrowLeft, Building2, CheckCircle, MessageCircle, XCircle } from 'lucide-react';
import { useMemo } from 'react';

type CompanyDetectionStepProps = {
  supportedCompanies: SupportedCompany[];
  supportContact: SupportContact;
  userCompanies: string[];
  onNext: (detectedCompany?: DetectedCompany) => void;
  onBack: () => void;
};

export function CompanyDetectionStep({
  supportedCompanies,
  supportContact,
  onNext,
  onBack,
}: CompanyDetectionStepProps) {
  const { getCompanyIconNode } = useMapping();

  // Find if user has any supported company permissions
  const userCompany = useMemo(() => {
    return supportedCompanies.find(company => company.userHasPermission === true);
  }, [supportedCompanies]);

  // Set hasDetectedCompany based on if we found a company with permissions
  const hasDetectedCompany = !!userCompany;

  // Create detectedCompany object from the found company with permissions
  const detectedCompany = useMemo(() => {
    if (!userCompany) {
      return undefined;
    }

    return {
      name: userCompany.name,
      description: userCompany.description,
      benefits: ['Premium account catalog', 'Special pricing', 'Priority support'],
    };
  }, [userCompany]);

  // Handle the next button click
  const handleNext = () => {
    onNext(detectedCompany);
  };

  return (
    <>
      <DialogHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          {hasDetectedCompany
            ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              )
            : (
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              )}
        </div>
        <DialogTitle>
          {hasDetectedCompany ? 'Company Detected!' : 'No Company Detected'}
        </DialogTitle>
        <DialogDescription>
          {hasDetectedCompany
            ? 'We\'ve automatically recognized your company affiliation'
            : 'We couldn\'t automatically detect your company affiliation. You can still access our services with standard pricing.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {hasDetectedCompany
          ? (
              <>
                <div className="border rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{detectedCompany?.name}</h3>
                    <Badge variant="secondary">Verified</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{detectedCompany?.description}</p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    🎯
                    {' '}
                    <strong>Great news!</strong>
                    {' '}
                    Your company has access to our premium account catalog
                    with special pricing and priority support.
                  </p>
                </div>
              </>
            )
          : (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Supported Companies
                  </h3>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    <div className="space-y-3">
                      {supportedCompanies.map((company) => {
                        const isUserCompany = company.userHasPermission === true;

                        return (
                          <div
                            key={company.name}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              isUserCompany
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                            }`}
                            style={!isUserCompany ? { opacity: '0.6', pointerEvents: 'none' } : {}}
                          >
                            {getCompanyIconNode(company.name.toLowerCase().replace(/\s/g, ''))}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{company.name}</h4>
                                {isUserCompany
                                  ? (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Available
                                      </span>
                                    )
                                  : (
                                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full flex items-center">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Unavailable
                                      </span>
                                    )}
                              </div>
                              <p className="text-xs text-muted-foreground">{company.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium mb-1">Don't see your company?</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          We're always adding new company partnerships. Suggest your company for inclusion
                          and get access to exclusive accounts.
                        </p>
                        <Button variant="outline" size="sm" className="text-xs bg-transparent">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {supportContact.displayText}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Finish
        </Button>
      </div>
    </>
  );
}
