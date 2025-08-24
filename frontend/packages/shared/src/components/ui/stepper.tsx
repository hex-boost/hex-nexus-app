import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';
import * as React from 'react';

type Step = {
  label?: string;
  description?: string;
  isCompleted: boolean;
  isOptional: boolean;
};

type StepperProps = {
  steps: Step[];
  activeStep: number;
} & React.HTMLAttributes<HTMLDivElement>;

export function Stepper({ steps, activeStep, className, ...props }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)} {...props}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2',
                step.isCompleted ? 'border-purple-600 bg-purple-600' : 'border-gray-600',
                activeStep === index && 'border-purple-600',
              )}
            >
              {step.isCompleted
                ? (
                    <Check className="h-5 w-5 text-white" />
                  )
                : (
                    <Circle className={cn('h-2.5 w-2.5', activeStep === index ? 'text-purple-600 fill-current' : 'text-gray-600')} />
                  )}
            </div>
            <p className={cn('text-sm font-medium', step.isCompleted || activeStep === index ? 'text-white' : 'text-gray-400')}>{step.label}</p>
          </div>
          {index < steps.length - 1 && (
            <div className={cn('h-1 w-full max-w-20 rounded-full', step.isCompleted ? 'bg-purple-600' : 'bg-gray-700')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
