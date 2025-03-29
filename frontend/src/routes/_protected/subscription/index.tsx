import type { PricingPlan } from '@/types/membership.ts';
import { Pricing } from '@/components/ui/pricing-cards.tsx';
import { createFileRoute } from '@tanstack/react-router';
import { MoveRight, PhoneCall } from 'lucide-react';

export const Route = createFileRoute('/_protected/subscription/')({
  component: RouteComponent,
});

function RouteComponent() {
  const pricingPlans: PricingPlan[] = [
    {
      tier: 'Tier 3',
      description: 'Nossa meta é simplificar o comércio de PMEs, tornando-o mais fácil e rápido para todos e em todos os lugares.',
      price: 10,
      benefits: [
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
      ],
      buttonText: 'Inscreva-se hoje',
      buttonVariant: 'outline',
      buttonIcon: <MoveRight className="w-4 h-4" />,
    },
    {
      tier: 'Tier 2',
      description: 'Nossa meta é simplificar o comércio de PMEs, tornando-o mais fácil e rápido para todos e em todos os lugares.',
      price: 20,
      benefits: [
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
      ],
      buttonText: 'Inscreva-se hoje',
      highlighted: true,
    },
    {
      tier: 'Enterprise',
      description: 'Nossa meta é simplificar o comércio de PMEs, tornando-o mais fácil e rápido para todos e em todos os lugares.',
      price: 30,
      benefits: [
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
        {
          title: 'Rápido e confiável',
          description: 'Fizemos isso rápido e confiável.',
        },
      ],
      buttonText: 'Agendar reunião',
      buttonVariant: 'outline',
      buttonIcon: <PhoneCall className="w-4 h-4" />,
    },
  ];
  return (
    <div>
      <Pricing title="fodase" subtitle="fodase" plans={pricingPlans} />

    </div>
  );
}
