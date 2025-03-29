import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, MoveRight, PhoneCall } from 'lucide-react';

// Interfaces para tipagem

function Pricing({
  title,
  subtitle,
  plans,
}: PricingProps) {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl tracking-tighter max-w-xl text-center font-semibold">
              {title}
            </h2>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
              {subtitle}
            </p>
          </div>
          <div className="grid pt-12 text-left grid-cols-1 lg:grid-cols-3 w-full gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`w-full rounded-md ${plan.highlighted ? 'shadow-2xl' : ''}`}>
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
                  <div className="flex flex-col gap-8 justify-start">
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
                      variant={plan.buttonVariant || (plan.highlighted ? 'default' : 'outline')}
                      className="gap-4"
                    >
                      {plan.buttonText}
                      {' '}
                      {plan.buttonIcon || (
                        plan.tier === 'Enterprise'
                          ? <PhoneCall className="w-4 h-4" />
                          : <MoveRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Pricing };
