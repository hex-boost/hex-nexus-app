import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { CompanyDetectionStep } from './steps/company-detection-step';
import { ReferralStep } from './steps/referral-step';

export type OnboardingData = {
  referralCode?: string;
  detectedCompany?: DetectedCompany;
};

export type DetectedCompany = {
  name: string;
  description: string;
  benefits: string[];
};

export type SupportedCompany = {
  name: string;
  description: string;
  logo: React.ReactNode;
  userHasPermission?: boolean;
};

export type SupportContact = {
  platform: string;
  handle: string;
  displayText: string;
};

export function OnboardingDialog() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const { user } = useUserStore();
  const [open, setOpen] = useState(user?.configuration?.isNewUser || true);
  const { mutate: onCompleteOnboarding } = useMutation({
    mutationFn: async () => {
      const res = await strapiClient.axios.put(`/users/${user?.id}`, {
        configuration: {
          isNewUser: false,
          referralCode: data.referralCode,
        },
      });
      return res.data;
    },
  });
  const supportContact: SupportContact = {
    platform: 'Discord',
    handle: '@naratios',
    displayText: 'Contact us on Discord: @naratios',
  };

  const { getCompanyIconNode } = useMapping();

  const supportedCompanies: SupportedCompany[] = [
    {
      name: 'Boost Royal',
      description: 'Premium exclusive accounts for employees',
      logo: getCompanyIconNode('boostroyal'),
      userHasPermission: user?.accountPermissions?.includes('boostroyal'),
    },
    {
      name: 'Turbo Boost',
      description: 'Premium exclusive accounts for employees',
      logo: getCompanyIconNode('turboboost'),
      userHasPermission: user?.accountPermissions?.includes('turboboost'),
    },
  ];

  const userCompanies = user?.accountPermissions || [];
  const totalSteps = 2;
  const handleReferralNext = (referralCode?: string) => {
    setData(prev => ({ ...prev, referralCode }));
    setCurrentStep(2);
  };

  const handleCompanyNext = (detectedCompany?: DetectedCompany) => {
    setData(prev => ({ ...prev, detectedCompany }));
    onCompleteOnboarding();
    setOpen(false);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  return (
    <Dialog open={open}>
      {/* <DialogOverlay className="backdrop-blur-sm" /> */}

      <DialogContent closeClassName="hidden" overlayClassName="backdrop-blur-sm" className="sm:max-w-2xl">
        <div className="px-6 pt-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Step
              {' '}
              {currentStep}
              {' '}
              of
              {' '}
              {totalSteps}
            </span>
            <span>
              {Math.round((currentStep / totalSteps) * 100)}
              %
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <div className="px-6 pb-6">
          {currentStep === 1 && (
            <ReferralStep onNext={handleReferralNext} />
          )}

          {currentStep === 2 && (
            <CompanyDetectionStep
              supportedCompanies={supportedCompanies}
              supportContact={supportContact}
              userCompanies={userCompanies}
              onNext={handleCompanyNext}
              onBack={handleBack}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
