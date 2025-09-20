import type { DetectedCompany, SupportContact, SupportedCompany } from '../onboarding-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMapping } from '@/lib/useMapping.tsx';
import { ArrowLeft, Building2, CheckCircle, MessageCircle, XCircle } from 'lucide-react';
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
  userCompanies,
}: CompanyDetectionStepProps) {
  const { getCompanyIconNode } = useMapping();

  const detectedUserCompany = useMemo(() => {
    return supportedCompanies.find(company =>
      userCompanies.includes(company.name.toLowerCase().replace(/\s/g, '')),
    );
  }, [supportedCompanies, userCompanies]);

  const detectedCompanyForNext = useMemo(() => {
    if (!detectedUserCompany) {
      return undefined;
    }

    return {
      name: detectedUserCompany.name,
      description: detectedUserCompany.description,

      benefits: ['Exclusive Accounts', 'Balance Transfer Payments', 'Priority support'],
    };
  }, [detectedUserCompany]);

  const handleNext = () => {
    onNext(detectedCompanyForNext);
  };

  return (
    <>
      {/* Aligned with user-experience: more generic and welcoming header */}
      <DialogHeader className="text-center">
        <DialogTitle>Check Your Company Benefits</DialogTitle>
        <DialogDescription>
          We've checked your affiliations to see if you qualify for exclusive benefits.
          Your detected companies are highlighted below.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Supported Companies
          </h3>
          {/* Unified view for the list of companies */}
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            <div className="space-y-3">
              {supportedCompanies.map((company) => {
                const isUserCompany = userCompanies.includes(company.name.toLowerCase().replace(/\s/g, ''));

                let containerClass = 'border-gray-200 bg-gray-50/50 text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400';
                let badgeClass = 'bg-gray-100 text-gray-800';
                let statusText = 'Not Detected';
                let StatusIcon = XCircle;

                if (isUserCompany) {
                  StatusIcon = CheckCircle;
                  const companyIdentifier = company.name.toLowerCase().replace(/\s/g, '');

                  if (companyIdentifier.includes('boostroyal')) {
                    containerClass = 'border-boostroyal-primary bg-boostroyal-primary/10 text-foreground dark:border-boostroyal-primary dark:bg-boostroyal-primary/10';
                    badgeClass = 'bg-boostroyal-primary/20 text-boostroyal-primary';
                    statusText = 'Boost Royal Detected';
                  } else if (companyIdentifier.includes('turbo')) {
                    containerClass = 'border-turboboost-primary bg-turboboost-primary/10 text-foreground dark:border-turboboost-primary dark:bg-turboboost-primary/10';
                    badgeClass = 'bg-turboboost-primary/20 text-turboboost-primary';
                    statusText = 'Turbo Boost Detected';
                  } else {
                    containerClass = 'border-green-500 bg-green-50 text-foreground dark:border-green-700 dark:bg-green-900/20';
                    badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                    statusText = 'Detected';
                  }
                }

                return (
                  <div
                    key={company.name}

                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${containerClass} ${!isUserCompany ? 'opacity-70' : ''}`}
                  >
                    {getCompanyIconNode(company.name.toLowerCase().replace(/\s/g, ''))}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{company.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center ${badgeClass}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusText}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{company.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* This card is now always visible for a better user experience */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Don't see your company?</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  We're always adding new company partnerships. Suggest your company for inclusion on Discord.
                </p>
                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {supportContact.displayText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
