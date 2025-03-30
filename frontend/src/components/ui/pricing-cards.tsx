import type { PricingProps } from '@/types/membership.ts';

import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

// Interfaces para tipagem

function Pricing({
  plans,
  onPlanSelect,
  isPending,
}: PricingProps) {
  return (
    <div className="grid pt-12 text-left grid-cols-1 lg:grid-cols-4 w-full gap-4">
      {plans.map((plan, index) => (
        <Card key={index} className={`w-full rounded-md ${plan.highlighted ? 'border border-primary shadow-primary/20 shadow-2xl' : ''}`}>
          <CardHeader>
            <CardTitle>
              <span className="flex flex-row gap-4 items-center font-normal">
                {plan.tier}
              </span>
            </CardTitle>
            <CardDescription>
              {plan.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-8 justify-between h-full">
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
              <div className="flex flex-col gap-4 justify-start">
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
              <Button
                loading={isPending}
                disabled={isPending}
                onClick={() => onPlanSelect(plan.tier)}
                variant={plan.buttonVariant || (plan.highlighted ? 'default' : 'outline')}
                className="gap-4 mt-auto"
              >
                {plan.buttonText}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { Pricing };
