import type { PricingPlan } from '@/types/membership.ts';
import { mockCheckoutSession } from '@/components/accountsMock.ts';
import { Badge } from '@/components/ui/badge';
import { Pricing } from '@/components/ui/pricing-cards.tsx';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { MoveRight } from 'lucide-react';
import { useState } from 'react';
import { OpenBrowser } from '../../../../wailsjs/go/utils/utils';

export const Route = createFileRoute('/_protected/subscription/')({
  component: RouteComponent,
});

function RouteComponent() {
  // Simular o tier atual do usuário vindo da API
  const [currentApiTier] = useState<string | undefined>('tier 2');
  const [pendingPlanTier, setPendingPlanTier] = useState<string | null>(null);

  // Converter o tier da API para o nome de exibição
  const mapTierToDisplayName = (tier: string | undefined): string => {
    switch (tier) {
      case 'tier 1': return 'Basic';
      case 'tier 2': return 'Premium';
      case 'tier 3': return 'Professional';
      default: return 'Free Trial';
    }
  };

  // Obter o nome de exibição atual
  const currentPlanTier = mapTierToDisplayName(currentApiTier);

  const { mutate: selectPlan } = useMutation({
    mutationKey: ['subscription'],
    mutationFn: async (tier: string) => {
      setPendingPlanTier(tier);
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.warn(tier);
      return mockCheckoutSession;
    },
    onSuccess: () => {
      OpenBrowser(mockCheckoutSession.url as string);
      setPendingPlanTier(null);
    },
    onError: () => {
      setPendingPlanTier(null);
    },
    onSettled: () => {
      // Opcional: resetar o estado pendente quando a mutação terminar
      // setPendingPlanTier(null);
    },
  });

  const pricingPlans: PricingPlan[] = [
    {
      tier: 'Free Trial',
      description: 'Try our service to see if it fits your boosting needs.',
      price: 0,
      period: 'month',
      benefits: [
        {
          title: 'Accounts up to Platinum',
          description: '',
        },
        {
          title: 'Wins 300 coins bonus',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Free Trial' ? 'Current Plan' : 'Get started for free',
      buttonVariant: 'outline',
      buttonIcon: <MoveRight className="w-4 h-4" />,
      highlighted: currentPlanTier === 'Free Trial',
    },
    {
      tier: 'Basic',
      description: 'Perfect for part-time boosters ',
      price: 10,
      benefits: [
        {
          title: 'Instantly earns 3000 coins',
          description: '',
        },
        {
          title: 'Accounts up to Emerald',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Basic' ? 'Current Plan' : 'Choose Basic',
      buttonVariant: 'outline',
      buttonIcon: <MoveRight className="w-4 h-4" />,
      highlighted: currentPlanTier === 'Basic',
    },
    {
      tier: 'Premium',
      description: 'The ideal solution for serious boosters who accounts.',
      price: 20,
      benefits: [
        {
          title: 'Instantly earns 10000 coins',
          description: '',
        },
        {
          title: 'Accounts up to Diamond',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Premium' ? 'Current Plan' : 'Choose Premium',
      highlighted: currentPlanTier === 'Premium',
    },
    {
      tier: 'Professional',
      description: 'For full-time professional boosters',
      price: 30,
      benefits: [
        {
          title: 'Unlimited coins & accounts',
          description: '',
        },
        {
          title: 'All ranks available',
          description: '',
        },
      ],
      buttonText: currentPlanTier === 'Professional' ? 'Current Plan' : 'Choose Professional',
      buttonVariant: 'outline',
      highlighted: currentPlanTier === 'Professional',
    },
  ];

  return (
    <div>
      <div className="w-full">
        <div className="">
          <div className="flex text-center justify-center items-center gap-4 flex-col">
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl tracking-tighter max-w-xl text-center font-semibold">
                Choose Your Boosting Experience
              </h2>
              <p className="leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
                Access premium LoL accounts for your boosting services with flexible plans
              </p>
              <p className="text-center">
                <Badge variant="outline" className="text-primary">
                  Current Plan:
                  {' '}
                  {currentPlanTier}
                </Badge>
              </p>
            </div>
            <Pricing pendingPlanTier={pendingPlanTier} onPlanSelect={selectPlan} plans={pricingPlans} />
          </div>
        </div>
      </div>
    </div>
  );
}
