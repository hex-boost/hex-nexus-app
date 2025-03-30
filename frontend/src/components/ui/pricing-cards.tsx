import type { PricingProps } from '@/types/membership.ts';

import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

function Pricing({
  plans,
  onPlanSelect,
  pendingPlanTier,
}: {
  plans: PricingProps['plans'];
  onPlanSelect: PricingProps['onPlanSelect'];
  pendingPlanTier: string | null;
}) {
  const isAnyPlanPending = pendingPlanTier !== null;

  return (
    <div className="grid pt-12 text-left grid-cols-1 lg:grid-cols-4 w-full gap-4">
      {plans.map((plan, index) => {
        const isPlanPending = pendingPlanTier === plan.tier;

        return (
          <Card key={index} className={`w-full rounded-md flex flex-col ${plan.highlighted ? 'border border-primary shadow-primary/20 shadow-2xl' : ''}`}>
            <CardHeader>
              <CardTitle>
                <span className="flex flex-row gap-4 items-center font-normal">
                  {plan.tier}
                </span>
              </CardTitle>
              <CardDescription className="min-h-[40px]">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 flex flex-col flex-1">
              <div className="flex flex-col gap-8 h-full">
                {/* Preço com altura fixa */}
                <div className="h-[10px] flex items-center">
                  <p className="flex flex-row items-center gap-2 text-xl">
                    <span className="text-4xl">
                      $
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {' '}
                      /
                      {' '}
                      {plan.period || 'month'}
                    </span>
                  </p>
                </div>

                {/* Benefícios com altura que pode crescer */}
                <div className="flex flex-col gap-4 justify-start flex-1">
                  {plan.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex flex-row gap-4">
                      <Check className="w-4 h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p>{benefit.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão sempre no final */}
                <div className="mt-auto pt-4">
                  <Button
                    loading={isPlanPending}
                    disabled={isAnyPlanPending}
                    onClick={() => onPlanSelect(plan.tier)}
                    variant={plan.buttonVariant || (plan.highlighted ? 'default' : 'outline')}
                    className="gap-4 w-full"
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { Pricing };
